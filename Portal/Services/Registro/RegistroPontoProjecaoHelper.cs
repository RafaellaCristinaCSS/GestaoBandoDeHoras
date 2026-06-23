using System;
using Portal.DTOs;
using Portal.Models;

namespace Portal.Services.Registro
{
    internal static class RegistroPontoProjecaoHelper
    {
        public static RegistroEstadoDto BuildEstado(RegistroPonto registro, EscalaDetalhe? detalhe)
        {
            var horasTrabalhadas = RegistroPontoCalculoHelper.GetHorasTrabalhadas(registro);
            var horasPlanejadas = RegistroPontoCalculoHelper.GetHorasPlanejadas(registro, detalhe);
            var saldo = RegistroPontoCalculoHelper.GetSaldoHoras(registro, detalhe);

            return new RegistroEstadoDto
            {
                Status = RegistroPontoStatusRules.BuildStatus(registro, detalhe),
                JornadaPrevista = RegistroPontoCalculoHelper.FormatJornadaPrevista(detalhe),
                HorasPrevistas = horasPlanejadas,
                HorasPrevistasFormatadas = RegistroPontoCalculoHelper.FormatHoras(horasPlanejadas),
                Entrada = string.IsNullOrWhiteSpace(registro.HoraEntrada) ? null : registro.HoraEntrada,
                AlmocInicio = string.IsNullOrWhiteSpace(registro.HoraAlmocoInicio) ? null : registro.HoraAlmocoInicio,
                AlmocFim = string.IsNullOrWhiteSpace(registro.HoraAlmocoFim) ? null : registro.HoraAlmocoFim,
                Saida = string.IsNullOrWhiteSpace(registro.HoraSaida) ? null : registro.HoraSaida,
                HorasTrabalhadas = horasTrabalhadas,
                HorasTrabalhadasFormatadas = RegistroPontoCalculoHelper.FormatHoras(horasTrabalhadas),
                SaldoHoras = saldo,
                SaldoHorasFormatado = RegistroPontoCalculoHelper.FormatHoras(saldo, signed: true),
            };
        }

        public static RegistroPonto CloneRegistro(RegistroPonto original)
            => new()
            {
                Id = original.Id,
                RegistroPontoId = original.RegistroPontoId,
                FuncionarioId = original.FuncionarioId,
                Data = original.Data,
                HoraEntrada = original.HoraEntrada,
                HoraAlmocoInicio = original.HoraAlmocoInicio,
                HoraAlmocoFim = original.HoraAlmocoFim,
                HoraSaida = original.HoraSaida,
                Presenca = original.Presenca,
                Folga = original.Folga,
                Feriado = original.Feriado,
                AtestadoMedico = original.AtestadoMedico,
                Ferias = original.Ferias,
                Observacao = original.Observacao,
                EscalaId = original.EscalaId,
                Escala = original.Escala,
                FuncionarioEscalaId = original.FuncionarioEscalaId,
                FuncionarioEscalaVinculo = original.FuncionarioEscalaVinculo,
                ChangeDate = original.ChangeDate,
            };

        public static RegistroPonto ProjetarComNovaEscala(
            RegistroPonto registro,
            Escala novaEscala,
            FuncionarioEscala novoVinculo)
        {
            var clone = CloneRegistro(registro);

            if (RegistroPontoStatusRules.BloqueiaHorarios(clone) || clone.Feriado)
                return clone;

            clone.EscalaId = novaEscala.Id;
            clone.Escala = novaEscala;
            clone.FuncionarioEscalaId = null;
            clone.FuncionarioEscalaVinculo = novoVinculo;

            var detalheNovo = RegistroPontoEscalaRules.ResolveDetalheParaData(clone.Data, novoVinculo);
            var sobrescreverHorarios = !RegistroPontoStatusRules.HasMarcacaoReal(clone) && clone.ChangeDate == null;

            RegistroPontoEscalaRules.ApplyEscala(
                clone,
                detalheNovo,
                sobrescreverHorarios: sobrescreverHorarios,
                aplicarFolga: true);

            RegistroPontoStatusRules.EnforceMarcacaoRules(clone, RegistroPontoStatusRules.CaptureSnapshot(registro));

            return clone;
        }

        public static bool EstadosEquivalentes(RegistroEstadoDto antes, RegistroEstadoDto depois)
            => antes.Status == depois.Status
                && antes.JornadaPrevista == depois.JornadaPrevista
                && antes.HorasPrevistasFormatadas == depois.HorasPrevistasFormatadas
                && antes.Entrada == depois.Entrada
                && antes.AlmocInicio == depois.AlmocInicio
                && antes.AlmocFim == depois.AlmocFim
                && antes.Saida == depois.Saida
                && antes.SaldoHorasFormatado == depois.SaldoHorasFormatado;

        public static string SugerirAcao(RegistroEstadoDto antes, RegistroEstadoDto depois)
        {
            if (antes.Status == "Falta" && depois.Status == "Folga")
                return "Converter falta para folga";

            if (antes.Status == "Folga" && depois.Status == "Presente")
                return "Converter folga para dia útil";

            if (antes.SaldoHorasFormatado != depois.SaldoHorasFormatado)
                return "Recalcular saldo de horas";

            if (antes.Status != depois.Status)
                return $"Atualizar status para {depois.Status}";

            return "Aplicar jornada da nova escala";
        }

        public static void AplicarEstadoManual(RegistroPonto registro, RegistroEstadoManualDto manual)
        {
            registro.Presenca = manual.Presenca;
            registro.Folga = manual.Folga;
            registro.Feriado = manual.Feriado;
            registro.AtestadoMedico = manual.AtestadoMedico;
            registro.Ferias = manual.Ferias;
            registro.HoraEntrada = manual.Entrada ?? string.Empty;
            registro.HoraAlmocoInicio = manual.AlmocInicio ?? string.Empty;
            registro.HoraAlmocoFim = manual.AlmocFim ?? string.Empty;
            registro.HoraSaida = manual.Saida ?? string.Empty;

            RegistroPontoStatusRules.EnforceMarcacaoRules(registro, RegistroPontoStatusRules.CaptureSnapshot(registro));
        }

        public static void AplicarEstadoProjetado(RegistroPonto registro, RegistroPonto projetado, Escala novaEscala, int? novoVinculoId)
        {
            registro.Presenca = projetado.Presenca;
            registro.Folga = projetado.Folga;
            registro.Feriado = projetado.Feriado;
            registro.AtestadoMedico = projetado.AtestadoMedico;
            registro.Ferias = projetado.Ferias;
            registro.HoraEntrada = projetado.HoraEntrada;
            registro.HoraAlmocoInicio = projetado.HoraAlmocoInicio;
            registro.HoraAlmocoFim = projetado.HoraAlmocoFim;
            registro.HoraSaida = projetado.HoraSaida;
            registro.EscalaId = novaEscala.Id;
            registro.FuncionarioEscalaId = novoVinculoId;
            registro.ChangeDate = DateTime.UtcNow;
        }
    }
}
