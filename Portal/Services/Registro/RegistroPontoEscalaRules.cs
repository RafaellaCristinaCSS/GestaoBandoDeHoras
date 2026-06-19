using System;
using System.Linq;
using Portal.Models;

namespace Portal.Services.Registro
{
    internal static class RegistroPontoEscalaRules
    {
        private static int GetEscalaDiaSemana(DateTime data)
            => ((int)data.DayOfWeek + 6) % 7;

        private static bool TrabalhaNoDiaDoze36(DateTime data, bool trabalhaDiaPar, DateTime? dataInicioVinculo)
        {
            var diaPar = data.Day % 2 == 0;

            if (!dataInicioVinculo.HasValue)
                return trabalhaDiaPar ? diaPar : !diaPar;

            var dataReferencia = dataInicioVinculo.Value.Date;
            var diasDecorridos = Math.Abs((data.Date - dataReferencia).Days);
            var trabalhaNaDataReferencia = trabalhaDiaPar
                ? dataReferencia.Day % 2 == 0
                : dataReferencia.Day % 2 != 0;

            return diasDecorridos % 2 == 0
                ? trabalhaNaDataReferencia
                : !trabalhaNaDataReferencia;
        }

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

        public static EscalaDetalhe? ResolveDetalheParaData(DateTime data, FuncionarioEscala? vinculo)
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

                var trabalhaHoje = TrabalhaNoDiaDoze36(data, trabalhaDiaPar.Value, vinculo?.DataInicio);
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

        public static EscalaDetalhe? ResolveDetalheParaRegistro(RegistroPonto registro)
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

                var trabalhaHoje = TrabalhaNoDiaDoze36(registro.Data, trabalhaDiaPar.Value, registro.FuncionarioEscalaVinculo?.DataInicio);
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

        public static void ApplyEscala(RegistroPonto registro, EscalaDetalhe? detalhe, bool sobrescreverHorarios = false, bool aplicarFolga = false)
        {
            if (detalhe == null)
                return;

            if (detalhe.Folga)
            {
                if (aplicarFolga)
                {
                    registro.Folga = true;
                    registro.Presenca = false;

                    if (sobrescreverHorarios || !RegistroPontoStatusRules.HasMarcacaoReal(registro))
                    {
                        registro.HoraEntrada = string.Empty;
                        registro.HoraAlmocoInicio = string.Empty;
                        registro.HoraAlmocoFim = string.Empty;
                        registro.HoraSaida = string.Empty;
                    }
                }

                return;
            }

            if (aplicarFolga)
            {
                registro.Folga = false;

                // Mantem consistencia em registros auto-gerados sem marcacoes reais.
                if (!RegistroPontoStatusRules.HasMarcacaoReal(registro))
                    registro.Presenca = true;
            }

            registro.HoraEntrada = sobrescreverHorarios || string.IsNullOrWhiteSpace(registro.HoraEntrada)
                ? detalhe.HoraInicio
                : registro.HoraEntrada;
            registro.HoraAlmocoInicio = sobrescreverHorarios || string.IsNullOrWhiteSpace(registro.HoraAlmocoInicio)
                ? (detalhe.HoraAlmocoInicio ?? string.Empty)
                : registro.HoraAlmocoInicio;
            registro.HoraAlmocoFim = sobrescreverHorarios || string.IsNullOrWhiteSpace(registro.HoraAlmocoFim)
                ? (detalhe.HoraAlmocoFim ?? string.Empty)
                : registro.HoraAlmocoFim;
            registro.HoraSaida = sobrescreverHorarios || string.IsNullOrWhiteSpace(registro.HoraSaida)
                ? detalhe.HoraFim
                : registro.HoraSaida;
        }

        public static bool DeveReaplicarEscala(RegistroPonto registro)
            => !registro.Feriado
                && !registro.AtestadoMedico
                && !registro.Ferias
                && !RegistroPontoStatusRules.HasMarcacaoReal(registro)
                && registro.ChangeDate == null;
    }
}
