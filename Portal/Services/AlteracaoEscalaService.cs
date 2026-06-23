using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.Data;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;
using Portal.Services.Registro;

namespace Portal.Services
{
    public interface IAlteracaoEscalaService
    {
        Task<SimulacaoAlteracaoEscalaResultDto> SimularAsync(SimularAlteracaoEscalaDto dto);
        Task<ConfirmarAlteracaoEscalaResultDto> ConfirmarAsync(ConfirmarAlteracaoEscalaDto dto);
    }

    public class AlteracaoEscalaService : IAlteracaoEscalaService
    {
        private readonly AppDbContext _context;
        private readonly IFuncionarioRepository _funcionarioRepository;
        private readonly IEscalaRepository _escalaRepository;
        private readonly IFuncionarioEscalaRepository _funcionarioEscalaRepository;
        private readonly IRegistroPontoRepository _registroPontoRepository;

        public AlteracaoEscalaService(
            AppDbContext context,
            IFuncionarioRepository funcionarioRepository,
            IEscalaRepository escalaRepository,
            IFuncionarioEscalaRepository funcionarioEscalaRepository,
            IRegistroPontoRepository registroPontoRepository)
        {
            _context = context;
            _funcionarioRepository = funcionarioRepository;
            _escalaRepository = escalaRepository;
            _funcionarioEscalaRepository = funcionarioEscalaRepository;
            _registroPontoRepository = registroPontoRepository;
        }

        private static DateTime ToUtcDate(DateTime data)
            => DateTime.SpecifyKind(data.Date, DateTimeKind.Utc);

        public async Task<SimulacaoAlteracaoEscalaResultDto> SimularAsync(SimularAlteracaoEscalaDto dto)
        {
            var dataVigencia = ToUtcDate(dto.DataVigencia);

            var funcionario = await _funcionarioRepository.GetByIdAsync(dto.FuncionarioId)
                ?? throw new ArgumentException("Funcionário não encontrado.");

            var novaEscala = await _escalaRepository.GetByIdAsync(dto.NovaEscalaId)
                ?? throw new ArgumentException("Nova escala não encontrada.");

            var escalaAtual = await _funcionarioEscalaRepository.GetCurrentByFuncionarioIdAsync(dto.FuncionarioId);
            if (escalaAtual?.EscalaId == dto.NovaEscalaId && escalaAtual.DataInicio.Date <= dataVigencia.Date)
                throw new ArgumentException("A nova escala é igual à escala vigente na data informada.");

            var trabalhaDiaPar = dto.TrabalhaDiaPar ?? novaEscala.TrabalhaDiaParPadrao;
            if (novaEscala.TipoEscala == TipoEscala.Doze36 && !trabalhaDiaPar.HasValue)
                throw new ArgumentException("Para escala 12x36, informe se o funcionário trabalha em dias pares ou ímpares.");

            var registros = (await _registroPontoRepository.GetFilteredAsync(
                dto.FuncionarioId,
                null,
                null,
                dataVigencia,
                DateTime.UtcNow.AddYears(2)))
                .Where(r => r.Data.Date >= dataVigencia.Date)
                .OrderBy(r => r.Data)
                .ToList();

            var vinculoHipotetico = BuildVinculoHipotetico(funcionario.Id, novaEscala, dataVigencia, trabalhaDiaPar);
            var divergencias = new List<RegistroDivergenciaDto>();

            foreach (var registro in registros)
            {
                var detalheAntigo = RegistroPontoEscalaRules.ResolveDetalheParaRegistro(registro);
                var antes = RegistroPontoProjecaoHelper.BuildEstado(registro, detalheAntigo);

                var detalheNovo = RegistroPontoEscalaRules.ResolveDetalheParaData(registro.Data, vinculoHipotetico);
                var novaEscalaEstado = new RegistroEstadoDto
                {
                    Status = detalheNovo?.Folga == true ? "Folga" : "Presente",
                    JornadaPrevista = RegistroPontoCalculoHelper.FormatJornadaPrevista(detalheNovo),
                    HorasPrevistas = detalheNovo?.Folga == true ? 0 : detalheNovo?.HorasPrevistas,
                    HorasPrevistasFormatadas = RegistroPontoCalculoHelper.FormatHoras(
                        detalheNovo?.Folga == true ? 0 : detalheNovo?.HorasPrevistas),
                };

                var projetado = RegistroPontoProjecaoHelper.ProjetarComNovaEscala(registro, novaEscala, vinculoHipotetico);
                var detalheResultado = RegistroPontoEscalaRules.ResolveDetalheParaData(registro.Data, vinculoHipotetico);
                var resultado = RegistroPontoProjecaoHelper.BuildEstado(projetado, detalheResultado);

                var possuiDivergencia = !RegistroPontoProjecaoHelper.EstadosEquivalentes(antes, resultado);

                divergencias.Add(new RegistroDivergenciaDto
                {
                    RegistroId = registro.Id,
                    Data = registro.Data.ToString("yyyy-MM-dd"),
                    Antes = antes,
                    NovaEscala = novaEscalaEstado,
                    ResultadoSugerido = resultado,
                    SugestaoAutomatica = possuiDivergencia
                        ? RegistroPontoProjecaoHelper.SugerirAcao(antes, resultado)
                        : string.Empty,
                    PossuiDivergencia = possuiDivergencia,
                });
            }

            var hoje = DateTime.UtcNow.Date;
            var afetaHistorico = dataVigencia.Date < hoje;

            return new SimulacaoAlteracaoEscalaResultDto
            {
                FuncionarioId = funcionario.Id,
                FuncionarioNome = funcionario.Nome,
                EscalaAtualId = escalaAtual?.EscalaId,
                EscalaAtualNome = escalaAtual?.Escala?.Nome ?? "-",
                NovaEscalaId = novaEscala.Id,
                NovaEscalaNome = novaEscala.Nome,
                DataVigencia = dataVigencia.ToString("yyyy-MM-dd"),
                TotalRegistrosAnalisados = divergencias.Count,
                TotalRegistrosImpactados = divergencias.Count(d => d.PossuiDivergencia),
                AfetaRegistrosHistoricos = afetaHistorico,
                AvisoHistorico = afetaHistorico
                    ? "Esta alteração afetará registros históricos. Certifique-se de que esta alteração está correta antes de continuar."
                    : string.Empty,
                Registros = divergencias,
            };
        }

        public async Task<ConfirmarAlteracaoEscalaResultDto> ConfirmarAsync(ConfirmarAlteracaoEscalaDto dto)
        {
            var simulacao = await SimularAsync(new SimularAlteracaoEscalaDto
            {
                FuncionarioId = dto.FuncionarioId,
                NovaEscalaId = dto.NovaEscalaId,
                DataVigencia = dto.DataVigencia,
                TrabalhaDiaPar = dto.TrabalhaDiaPar,
            });

            var dataVigencia = ToUtcDate(dto.DataVigencia);
            var novaEscala = await _escalaRepository.GetByIdAsync(dto.NovaEscalaId)
                ?? throw new ArgumentException("Nova escala não encontrada.");

            var trabalhaDiaPar = dto.TrabalhaDiaPar ?? novaEscala.TrabalhaDiaParPadrao;
            var escalaAtual = await _funcionarioEscalaRepository.GetCurrentByFuncionarioIdAsync(dto.FuncionarioId);

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (escalaAtual != null)
                {
                    escalaAtual.DataFim = dataVigencia.AddDays(-1);
                    await _funcionarioEscalaRepository.UpdateAsync(escalaAtual);
                }

                var novoVinculo = new FuncionarioEscala
                {
                    FuncionarioId = dto.FuncionarioId,
                    EscalaId = dto.NovaEscalaId,
                    DataInicio = dataVigencia,
                    DataFim = null,
                    TrabalhaDiaPar = novaEscala.TipoEscala == TipoEscala.Doze36 ? trabalhaDiaPar : null,
                    CreatedByUserId = dto.UsuarioId,
                    CreatedAt = DateTime.UtcNow,
                };

                await _funcionarioEscalaRepository.AddAsync(novoVinculo);
                await _funcionarioEscalaRepository.SaveChangesAsync();

                novoVinculo.Escala = novaEscala;

                var vinculoHipotetico = BuildVinculoHipotetico(dto.FuncionarioId, novaEscala, dataVigencia, trabalhaDiaPar);
                vinculoHipotetico.Id = novoVinculo.Id;

                var decisoesPorRegistro = dto.Decisoes.ToDictionary(d => d.RegistroId, d => d);
                var alteradosAutomaticamente = 0;
                var alteradosManualmente = 0;

                foreach (var item in simulacao.Registros)
                {
                    if (!item.PossuiDivergencia)
                        continue;

                    var registro = await _registroPontoRepository.GetByIdAsync(item.RegistroId);
                    if (registro == null)
                        continue;

                    var decisao = decisoesPorRegistro.GetValueOrDefault(item.RegistroId);
                    var acao = decisao?.Acao ?? "aplicar_sugestao";

                    if (acao == "manter_atual")
                        continue;

                    if (acao == "manual" && decisao?.Manual != null)
                    {
                        RegistroPontoProjecaoHelper.AplicarEstadoManual(registro, decisao.Manual);
                        registro.EscalaId = novaEscala.Id;
                        registro.FuncionarioEscalaId = novoVinculo.Id;
                        registro.ChangeDate = DateTime.UtcNow;
                        alteradosManualmente++;
                    }
                    else
                    {
                        var projetado = RegistroPontoProjecaoHelper.ProjetarComNovaEscala(registro, novaEscala, vinculoHipotetico);
                        RegistroPontoProjecaoHelper.AplicarEstadoProjetado(registro, projetado, novaEscala, novoVinculo.Id);
                        alteradosAutomaticamente++;
                    }

                    await _registroPontoRepository.UpdateAsync(registro);
                }

                var auditoria = new AlteracaoEscalaAuditoria
                {
                    FuncionarioId = dto.FuncionarioId,
                    EscalaAnteriorId = escalaAtual?.EscalaId,
                    NovaEscalaId = dto.NovaEscalaId,
                    DataVigencia = dataVigencia,
                    UsuarioId = dto.UsuarioId,
                    DataAlteracao = DateTime.UtcNow,
                    TotalRegistrosAnalisados = simulacao.TotalRegistrosAnalisados,
                    TotalRegistrosImpactados = simulacao.TotalRegistrosImpactados,
                    RegistrosAlteradosAutomaticamente = alteradosAutomaticamente,
                    RegistrosAlteradosManualmente = alteradosManualmente,
                };

                await _context.Set<AlteracaoEscalaAuditoria>().AddAsync(auditoria);
                await _registroPontoRepository.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ConfirmarAlteracaoEscalaResultDto
                {
                    AuditoriaId = auditoria.Id,
                    FuncionarioEscalaId = novoVinculo.Id,
                    RegistrosAlteradosAutomaticamente = alteradosAutomaticamente,
                    RegistrosAlteradosManualmente = alteradosManualmente,
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static FuncionarioEscala BuildVinculoHipotetico(
            int funcionarioId,
            Escala novaEscala,
            DateTime dataVigencia,
            bool? trabalhaDiaPar)
            => new()
            {
                FuncionarioId = funcionarioId,
                EscalaId = novaEscala.Id,
                Escala = novaEscala,
                DataInicio = dataVigencia,
                DataFim = null,
                TrabalhaDiaPar = novaEscala.TipoEscala == TipoEscala.Doze36 ? trabalhaDiaPar : null,
            };
    }
}
