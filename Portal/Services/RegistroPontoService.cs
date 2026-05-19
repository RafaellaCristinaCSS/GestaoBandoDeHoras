using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;
using Portal.Utils;

namespace Portal.Services
{
    public class RegistroPontoService : IRegistroPontoService
    {
        private readonly IRegistroPontoRepository _repository;
        private readonly IFuncionarioEscalaRepository _funcionarioEscalaRepository;

        private static int GetEscalaDiaSemana(DateTime data)
            => ((int)data.DayOfWeek + 6) % 7;

        private static EscalaDetalhe NormalizeDoze36Detalhe(EscalaDetalhe detalhe)
        {
            if (detalhe.Folga)
                return detalhe;

            if (!TimeOnly.TryParse(detalhe.HoraInicio, out var horaInicio)
                || !TimeOnly.TryParse(detalhe.HoraFim, out var horaFim)
                || horaFim <= horaInicio)
                return detalhe;

            var minutosTrabalho = (int)(horaFim - horaInicio).TotalMinutes;

            if (TimeOnly.TryParse(detalhe.HoraAlmocoInicio, out var horaAlmocoInicio)
                && TimeOnly.TryParse(detalhe.HoraAlmocoFim, out var horaAlmocoFim)
                && horaAlmocoFim > horaAlmocoInicio)
            {
                minutosTrabalho -= (int)(horaAlmocoFim - horaAlmocoInicio).TotalMinutes;
            }

            return new EscalaDetalhe
            {
                Id = detalhe.Id,
                EscalaId = detalhe.EscalaId,
                Escala = detalhe.Escala,
                DiaSemana = detalhe.DiaSemana,
                HoraInicio = detalhe.HoraInicio,
                HoraFim = detalhe.HoraFim,
                HoraAlmocoInicio = detalhe.HoraAlmocoInicio,
                HoraAlmocoFim = detalhe.HoraAlmocoFim,
                HorasPrevistas = minutosTrabalho > 0 ? minutosTrabalho / 60m : 0,
                Folga = detalhe.Folga
            };
        }

        private static bool HasMarcacaoReal(RegistroPonto registro)
            => !string.IsNullOrWhiteSpace(registro.HoraEntrada)
                || !string.IsNullOrWhiteSpace(registro.HoraAlmocoInicio)
                || !string.IsNullOrWhiteSpace(registro.HoraAlmocoFim)
                || !string.IsNullOrWhiteSpace(registro.HoraSaida);

        private static void ApplyEscala(RegistroPonto registro, EscalaDetalhe? detalhe)
        {
            if (detalhe == null || detalhe.Folga)
                return;

            registro.HoraEntrada = string.IsNullOrWhiteSpace(registro.HoraEntrada) ? detalhe.HoraInicio : registro.HoraEntrada;
            registro.HoraAlmocoInicio = string.IsNullOrWhiteSpace(registro.HoraAlmocoInicio) ? (detalhe.HoraAlmocoInicio ?? string.Empty) : registro.HoraAlmocoInicio;
            registro.HoraAlmocoFim = string.IsNullOrWhiteSpace(registro.HoraAlmocoFim) ? (detalhe.HoraAlmocoFim ?? string.Empty) : registro.HoraAlmocoFim;
            registro.HoraSaida = string.IsNullOrWhiteSpace(registro.HoraSaida) ? detalhe.HoraFim : registro.HoraSaida;
        }

        private static EscalaDetalhe? ResolveDetalheParaData(DateTime data, FuncionarioEscala? vinculo)
        {
            var escala = vinculo?.Escala;
            if (escala == null || escala.Detalhes == null || escala.Detalhes.Count == 0)
                return null;

            if (escala.TipoEscala == TipoEscala.Doze36)
            {
                var detalheTrabalho = escala.Detalhes
                    .OrderBy(d => d.DiaSemana)
                    .FirstOrDefault(d => !d.Folga) ?? escala.Detalhes.First();

                var trabalhaDiaPar = vinculo?.TrabalhaDiaPar ?? escala.TrabalhaDiaParPadrao;
                if (!trabalhaDiaPar.HasValue)
                    return detalheTrabalho;

                var diaPar = data.Day % 2 == 0;
                var trabalhaHoje = trabalhaDiaPar.Value ? diaPar : !diaPar;
                if (!trabalhaHoje)
                {
                    return new EscalaDetalhe
                    {
                        Folga = true,
                        HorasPrevistas = 0,
                        HoraInicio = string.Empty,
                        HoraFim = string.Empty,
                        HoraAlmocoInicio = string.Empty,
                        HoraAlmocoFim = string.Empty
                    };
                }

                return NormalizeDoze36Detalhe(detalheTrabalho);
            }

            var diaSemana = GetEscalaDiaSemana(data);
            return escala.Detalhes.FirstOrDefault(d => d.DiaSemana == diaSemana);
        }

        private static EscalaDetalhe? ResolveDetalheParaRegistro(RegistroPonto registro)
        {
            if (registro.Escala == null || registro.Escala.Detalhes == null || registro.Escala.Detalhes.Count == 0)
                return null;

            if (registro.Escala.TipoEscala == TipoEscala.Doze36)
            {
                var detalheTrabalho = registro.Escala.Detalhes
                    .OrderBy(d => d.DiaSemana)
                    .FirstOrDefault(d => !d.Folga) ?? registro.Escala.Detalhes.First();

                var trabalhaDiaPar = registro.FuncionarioEscalaVinculo?.TrabalhaDiaPar ?? registro.Escala.TrabalhaDiaParPadrao;
                if (!trabalhaDiaPar.HasValue)
                    return detalheTrabalho;

                var diaPar = registro.Data.Day % 2 == 0;
                var trabalhaHoje = trabalhaDiaPar.Value ? diaPar : !diaPar;
                if (!trabalhaHoje)
                {
                    return new EscalaDetalhe
                    {
                        Folga = true,
                        HorasPrevistas = 0,
                        HoraInicio = string.Empty,
                        HoraFim = string.Empty,
                        HoraAlmocoInicio = string.Empty,
                        HoraAlmocoFim = string.Empty
                    };
                }

                return NormalizeDoze36Detalhe(detalheTrabalho);
            }

            var diaSemana = GetEscalaDiaSemana(registro.Data);
            return registro.Escala.Detalhes.FirstOrDefault(d => d.DiaSemana == diaSemana);
        }

        private static string BuildStatus(RegistroPonto e)
        {
            if (e.Feriado)
                return "Feriado";

            var detalhe = ResolveDetalheParaRegistro(e);
            if (detalhe?.Folga == true && !HasMarcacaoReal(e))
                return "Folga";

            if (!e.Presenca)
                return "Falta";

            return "Presente";
        }

        private static RegistroPontoReadDto ToReadDto(RegistroPonto e)
        {
            // Usa a escala salva no próprio registro (histórico imutável)
            var detalhe = ResolveDetalheParaRegistro(e);

            return new RegistroPontoReadDto
            {
                Id = e.Id,
                FuncionarioId = e.FuncionarioId ?? e.RegistroPontoId,
                Data = e.Data.ToString("yyyy-MM-dd"),
                Entrada = e.HoraEntrada,
                AlmocInicio = e.HoraAlmocoInicio,
                AlmocFim = e.HoraAlmocoFim,
                Saida = e.HoraSaida,
                EntradaPlanejada = detalhe?.Folga == true ? null : detalhe?.HoraInicio,
                SaidaPlanejada = detalhe?.Folga == true ? null : detalhe?.HoraFim,
                HorasPrevistas = detalhe?.Folga == true ? 0 : detalhe?.HorasPrevistas,
                Presenca = e.Presenca,
                Feriado = e.Feriado,
                Observacao = e.Observacao,
                Status = BuildStatus(e),
                EscalaId = e.EscalaId,
                FuncionarioEscalaId = e.FuncionarioEscalaId,
                FuncionarioName = e.Funcionario?.Nome,
                CreatedByUserId = e.CreatedByUserId,
                UpdatedByUserId = e.UpdatedByUserId,
                StartDate = e.StartDate,
                ChangeDate = e.ChangeDate,
                Excluded = e.Excluded
            };
        }

        public RegistroPontoService(IRegistroPontoRepository repository, IFuncionarioEscalaRepository funcionarioEscalaRepository)
        {
            _repository = repository;
            _funcionarioEscalaRepository = funcionarioEscalaRepository;
        }

        public async Task<IEnumerable<RegistroPontoReadDto>> GetAllAsync(int? funcionarioId = null, int? mes = null, int? ano = null)
        {
            if (funcionarioId.HasValue && mes.HasValue && ano.HasValue)
            {
                var registrosMes = (await _repository.GetFilteredAsync(funcionarioId, mes, ano)).ToList();
                var (dataInicio, dataFim) = CompetenciaHelper.ObterPeriodoCompetencia(mes.Value, ano.Value);

                for (var dataAtual = dataInicio; dataAtual <= dataFim; dataAtual = dataAtual.AddDays(1))
                {
                    var data = new DateTime(
                        dataAtual.Year,
                        dataAtual.Month,
                        dataAtual.Day,
                        0,
                        0,
                        0,
                        DateTimeKind.Utc);
                    var existe = registrosMes.Any(r => r.Data.Date == data.Date);
                    if (existe)
                        continue;

                    // Busca o vínculo histórico válido para a data — garante imutabilidade histórica
                    var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(funcionarioId.Value, data);
                    var detalhe = ResolveDetalheParaData(data, vincEscala);

                    var novo = new RegistroPonto
                    {
                        FuncionarioId = funcionarioId.Value,
                        Data = data,
                        HoraEntrada = string.Empty,
                        HoraAlmocoInicio = string.Empty,
                        HoraAlmocoFim = string.Empty,
                        HoraSaida = string.Empty,
                        Presenca = true,
                        Feriado = false,
                        Observacao = string.Empty,
                        // Referências históricas salvas no registro para cálculos futuros
                        EscalaId = vincEscala?.EscalaId,
                        FuncionarioEscalaId = vincEscala?.Id,
                        CreatedByUserId = 0,
                        StartDate = DateTime.UtcNow,
                        Excluded = false
                    };

                    ApplyEscala(novo, detalhe);

                    await _repository.AddAsync(novo);
                }

                await _repository.SaveChangesAsync();
            }

            var list = (await _repository.GetFilteredAsync(funcionarioId, mes, ano)).ToList();

            var atualizouRegistrosExistentes = false;
            foreach (var registro in list)
            {
                if (registro.Feriado || !registro.Presenca || HasMarcacaoReal(registro))
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

                var detalhe = ResolveDetalheParaRegistro(registro);
                if (detalhe == null || detalhe.Folga)
                    continue;

                var entradaAnterior = registro.HoraEntrada;
                var almocoInicioAnterior = registro.HoraAlmocoInicio;
                var almocoFimAnterior = registro.HoraAlmocoFim;
                var saidaAnterior = registro.HoraSaida;

                ApplyEscala(registro, detalhe);

                if (registro.HoraEntrada != entradaAnterior
                    || registro.HoraAlmocoInicio != almocoInicioAnterior
                    || registro.HoraAlmocoFim != almocoFimAnterior
                    || registro.HoraSaida != saidaAnterior)
                {
                    await _repository.UpdateAsync(registro);
                    atualizouRegistrosExistentes = true;
                }
            }

            if (atualizouRegistrosExistentes)
                await _repository.SaveChangesAsync();

            return list.Select(ToReadDto);
        }

        public async Task<RegistroPontoReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return ToReadDto(entity);
        }

        public async Task<RegistroPontoReadDto> CreateAsync(RegistroPontoCreateDto dto)
        {
            if (dto.FuncionarioId <= 0) throw new Exception("FuncionarioId é obrigatório!");

            var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(dto.FuncionarioId, dto.Data);
            var escalaDoDia = ResolveDetalheParaData(dto.Data, vincEscala);

            var entity = new RegistroPonto();

            entity.RegistroPontoId = dto.FuncionarioId;
            entity.FuncionarioId = dto.FuncionarioId;
            entity.Data = dto.Data;
            entity.HoraEntrada = dto.Entrada ?? string.Empty;
            entity.HoraAlmocoInicio = dto.AlmocInicio ?? string.Empty;
            entity.HoraAlmocoFim = dto.AlmocFim ?? string.Empty;
            entity.HoraSaida = dto.Saida ?? string.Empty;
            entity.Presenca = dto.Presenca;
            entity.Feriado = dto.Feriado;
            entity.Observacao = dto.Observacao ?? string.Empty;
            // Salva referências históricas imutáveis da escala vigente na data
            entity.EscalaId = vincEscala?.EscalaId;
            entity.FuncionarioEscalaId = vincEscala?.Id;

            if (entity.Feriado)
            {
                entity.HoraEntrada = string.Empty;
                entity.HoraAlmocoInicio = string.Empty;
                entity.HoraAlmocoFim = string.Empty;
                entity.HoraSaida = string.Empty;
            }
            else
            {
                ApplyEscala(entity, escalaDoDia);
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

                // Se campos de horário vierem vazios, reaplica a escala válida para a data/funcionário informados.
                var detalhe = ResolveDetalheParaData(dataEfetiva, vincEscala);
                ApplyEscala(entity, detalhe);
            }

            entity.HoraEntrada = dto.Entrada ?? entity.HoraEntrada;
            entity.HoraAlmocoInicio = dto.AlmocInicio ?? entity.HoraAlmocoInicio;
            entity.HoraAlmocoFim = dto.AlmocFim ?? entity.HoraAlmocoFim;
            entity.HoraSaida = dto.Saida ?? entity.HoraSaida;
            if (dto.Presenca != null)
                entity.Presenca = dto.Presenca ?? entity.Presenca;
            if (dto.Feriado != null)
                entity.Feriado = dto.Feriado ?? entity.Feriado;

            if (dto.Feriado == true)
            {
                entity.HoraEntrada = string.Empty;
                entity.HoraAlmocoInicio = string.Empty;
                entity.HoraAlmocoFim = string.Empty;
                entity.HoraSaida = string.Empty;
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
