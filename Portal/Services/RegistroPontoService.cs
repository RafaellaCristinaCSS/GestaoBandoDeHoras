using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;
using Portal.Services.Registro;
using Portal.Utils;

namespace Portal.Services
{
    public class RegistroPontoService : IRegistroPontoService
    {
        private static readonly ConcurrentDictionary<int, SemaphoreSlim> _geracaoPorFuncionarioLocks = new();
        private readonly IRegistroPontoRepository _repository;
        private readonly IFuncionarioEscalaRepository _funcionarioEscalaRepository;

        public RegistroPontoService(IRegistroPontoRepository repository, IFuncionarioEscalaRepository funcionarioEscalaRepository)
        {
            _repository = repository;
            _funcionarioEscalaRepository = funcionarioEscalaRepository;
        }

        public async Task<IEnumerable<RegistroPontoReadDto>> GetAllAsync(int? funcionarioId = null, int? mes = null, int? ano = null, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            if (dataInicio.HasValue != dataFim.HasValue)
                throw new ArgumentException("Informe data inicial e data final para filtrar por período.");

            var periodo = dataInicio.HasValue && dataFim.HasValue
                ? CompetenciaHelper.NormalizarPeriodo(dataInicio.Value, dataFim.Value)
                : mes.HasValue && ano.HasValue
                    ? CompetenciaHelper.ObterPeriodoCompetencia(mes.Value, ano.Value)
                    : ((DateTime DataInicio, DateTime DataFim)?)null;

            if (funcionarioId.HasValue && periodo.HasValue)
            {
                var lockFuncionario = _geracaoPorFuncionarioLocks.GetOrAdd(funcionarioId.Value, _ => new SemaphoreSlim(1, 1));
                await lockFuncionario.WaitAsync();

                try
                {
                    var registrosMes = (await _repository.GetFilteredAsync(funcionarioId, mes, ano, dataInicio, dataFim)).ToList();
                    var datasExistentes = registrosMes
                        .Select(r => r.Data.Date)
                        .ToHashSet();
                    var (periodoInicio, periodoFim) = periodo.Value;

                    for (var dataAtual = periodoInicio; dataAtual <= periodoFim; dataAtual = dataAtual.AddDays(1))
                    {
                        var data = new DateTime(
                            dataAtual.Year,
                            dataAtual.Month,
                            dataAtual.Day,
                            0,
                            0,
                            0,
                            DateTimeKind.Utc);

                        if (datasExistentes.Contains(data.Date))
                            continue;

                        // Busca o vínculo histórico válido para a data — garante imutabilidade histórica
                        var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(funcionarioId.Value, data);
                        var detalhe = RegistroPontoEscalaRules.ResolveDetalheParaData(data, vincEscala);

                        var novo = new RegistroPonto
                        {
                            FuncionarioId = funcionarioId.Value,
                            Data = data,
                            HoraEntrada = string.Empty,
                            HoraAlmocoInicio = string.Empty,
                            HoraAlmocoFim = string.Empty,
                            HoraSaida = string.Empty,
                            Presenca = true,
                            Folga = false,
                            Feriado = false,
                            Observacao = string.Empty,
                            // Referências históricas salvas no registro para cálculos futuros
                            EscalaId = vincEscala?.EscalaId,
                            FuncionarioEscalaId = vincEscala?.Id,
                            CreatedByUserId = 0,
                            StartDate = DateTime.UtcNow,
                            Excluded = false
                        };

                        RegistroPontoEscalaRules.ApplyEscala(novo, detalhe, aplicarFolga: true);

                        await _repository.AddAsync(novo);
                        datasExistentes.Add(data.Date);
                    }

                    await _repository.SaveChangesAsync();
                }
                finally
                {
                    lockFuncionario.Release();
                }
            }

            var list = SelecionarRegistrosUnicosPorDia((await _repository.GetFilteredAsync(funcionarioId, mes, ano, dataInicio, dataFim)).ToList());

            var atualizouRegistrosExistentes = false;
            foreach (var registro in list)
            {
                if (!RegistroPontoEscalaRules.DeveReaplicarEscala(registro))
                    continue;

                if ((!registro.EscalaId.HasValue || !registro.FuncionarioEscalaId.HasValue)
                    && registro.FuncionarioId.HasValue)
                {
                    var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(registro.FuncionarioId.Value, registro.Data);
                    if (vincEscala != null)
                    {
                        registro.EscalaId = vincEscala.EscalaId;
                        registro.FuncionarioEscalaId = vincEscala.Id;
                        registro.Escala = vincEscala.Escala;
                        registro.FuncionarioEscalaVinculo = vincEscala;
                    }
                }

                var detalhe = RegistroPontoEscalaRules.ResolveDetalheParaRegistro(registro);
                if (detalhe == null)
                    continue;

                var entradaAnterior = registro.HoraEntrada;
                var almocoInicioAnterior = registro.HoraAlmocoInicio;
                var almocoFimAnterior = registro.HoraAlmocoFim;
                var saidaAnterior = registro.HoraSaida;
                var presencaAnterior = registro.Presenca;
                var folgaAnterior = registro.Folga;

                RegistroPontoEscalaRules.ApplyEscala(registro, detalhe, sobrescreverHorarios: true, aplicarFolga: true);

                if (registro.HoraEntrada != entradaAnterior
                    || registro.HoraAlmocoInicio != almocoInicioAnterior
                    || registro.HoraAlmocoFim != almocoFimAnterior
                    || registro.HoraSaida != saidaAnterior
                    || registro.Presenca != presencaAnterior
                    || registro.Folga != folgaAnterior)
                {
                    await _repository.UpdateAsync(registro);
                    atualizouRegistrosExistentes = true;
                }
            }

            if (atualizouRegistrosExistentes)
                await _repository.SaveChangesAsync();

            return list.Select(RegistroPontoMapper.ToReadDto);
        }

        private static List<RegistroPonto> SelecionarRegistrosUnicosPorDia(IEnumerable<RegistroPonto> registros)
        {
            return registros
                .GroupBy(r => new { r.FuncionarioId, Dia = r.Data.Date })
                .Select(g => g
                    .OrderByDescending(RegistroPontoStatusRules.HasMarcacaoReal)
                    .ThenByDescending(r => r.ChangeDate.HasValue)
                    .ThenByDescending(r => r.ChangeDate ?? r.StartDate)
                    .ThenByDescending(r => r.Id)
                    .First())
                .OrderBy(r => r.Data)
                .ToList();
        }

        public async Task<RegistroPontoReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return RegistroPontoMapper.ToReadDto(entity);
        }

        public async Task<RegistroPontoReadDto> CreateAsync(RegistroPontoCreateDto dto)
        {
            if (dto.FuncionarioId <= 0) throw new Exception("FuncionarioId é obrigatório!");

            var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(dto.FuncionarioId, dto.Data);
            var escalaDoDia = RegistroPontoEscalaRules.ResolveDetalheParaData(dto.Data, vincEscala);

            var entity = new RegistroPonto();

            entity.RegistroPontoId = dto.FuncionarioId;
            entity.FuncionarioId = dto.FuncionarioId;
            entity.Data = dto.Data;
            entity.HoraEntrada = dto.Entrada ?? string.Empty;
            entity.HoraAlmocoInicio = dto.AlmocInicio ?? string.Empty;
            entity.HoraAlmocoFim = dto.AlmocFim ?? string.Empty;
            entity.HoraSaida = dto.Saida ?? string.Empty;
            entity.Presenca = dto.Presenca;
            entity.Folga = dto.Folga;
            entity.Feriado = dto.Feriado;
            entity.AtestadoMedico = dto.AtestadoMedico;
            entity.Observacao = dto.Observacao ?? string.Empty;
            // Salva referências históricas imutáveis da escala vigente na data
            entity.EscalaId = vincEscala?.EscalaId;
            entity.FuncionarioEscalaId = vincEscala?.Id;

            if (!entity.Feriado && !entity.AtestadoMedico)
            {
                RegistroPontoEscalaRules.ApplyEscala(entity, escalaDoDia, aplicarFolga: true);
            }

            entity.StartDate = DateTime.UtcNow;
            entity.Excluded = false;

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            var created = await GetByIdAsync(entity.Id);
            if (created == null)
                throw new Exception("Falha ao recuperar o registro de ponto criado.");

            return created;
        }

        public async Task<bool> UpdateAsync(int id, RegistroPontoUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            var funcionarioEfetivo = dto.FuncionarioId ?? entity.FuncionarioId;
            var dataEfetiva = dto.Data ?? entity.Data;
            var feriadoEfetivo = dto.Feriado ?? entity.Feriado;
            var atestadoEfetivo = dto.AtestadoMedico ?? entity.AtestadoMedico;

            if (dto.FuncionarioId != null)
            {
                entity.RegistroPontoId = dto.FuncionarioId ?? entity.RegistroPontoId;
                entity.FuncionarioId = dto.FuncionarioId ?? entity.FuncionarioId;
            }
            if (dto.Data != null)
                entity.Data = dto.Data ?? entity.Data;

            if (funcionarioEfetivo.HasValue)
            {
                var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(funcionarioEfetivo.Value, dataEfetiva);
                entity.EscalaId = vincEscala?.EscalaId;
                entity.FuncionarioEscalaId = vincEscala?.Id;

                if (!feriadoEfetivo && !atestadoEfetivo)
                {
                    // Se campos de horário vierem vazios, reaplica a escala válida para a data/funcionário informados.
                    var detalhe = RegistroPontoEscalaRules.ResolveDetalheParaData(dataEfetiva, vincEscala);
                    var deveAplicarFolgaEscala = !entity.ChangeDate.HasValue || dto.FuncionarioId != null || dto.Data != null;
                    RegistroPontoEscalaRules.ApplyEscala(entity, detalhe, aplicarFolga: deveAplicarFolgaEscala);
                }
            }

            entity.HoraEntrada = dto.Entrada ?? entity.HoraEntrada;
            entity.HoraAlmocoInicio = dto.AlmocInicio ?? entity.HoraAlmocoInicio;
            entity.HoraAlmocoFim = dto.AlmocFim ?? entity.HoraAlmocoFim;
            entity.HoraSaida = dto.Saida ?? entity.HoraSaida;
            if (dto.Presenca != null)
                entity.Presenca = dto.Presenca ?? entity.Presenca;
            if (dto.Folga != null)
                entity.Folga = dto.Folga ?? entity.Folga;
            if (dto.Feriado != null)
                entity.Feriado = dto.Feriado ?? entity.Feriado;
            if (dto.AtestadoMedico != null)
                entity.AtestadoMedico = dto.AtestadoMedico ?? entity.AtestadoMedico;

            if (entity.Presenca && !entity.Feriado && !entity.AtestadoMedico && funcionarioEfetivo.HasValue)
            {
                var detalheAtual = RegistroPontoEscalaRules.ResolveDetalheParaRegistro(entity);
                if (!RegistroPontoStatusRules.HasMarcacaoReal(entity) && detalheAtual != null && !detalheAtual.Folga)
                {
                    RegistroPontoEscalaRules.ApplyEscala(entity, detalheAtual, sobrescreverHorarios: true);
                }
            }

            entity.Observacao = dto.Observacao ?? entity.Observacao;

            entity.ChangeDate = DateTime.UtcNow;
            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            entity.Excluded = true;
            entity.ChangeDate = DateTime.UtcNow;

            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();
            return true;
        }
    }
}
