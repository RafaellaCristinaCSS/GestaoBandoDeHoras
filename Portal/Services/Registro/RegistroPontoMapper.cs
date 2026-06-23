using Portal.DTOs;
using Portal.Models;

namespace Portal.Services.Registro
{
    internal static class RegistroPontoMapper
    {
        public static RegistroPontoReadDto ToReadDto(RegistroPonto registro)
        {
            var detalhe = RegistroPontoEscalaRules.ResolveDetalheParaRegistro(registro);

            decimal? horasPrevistas = registro.Folga || registro.Ferias ? 0 : detalhe?.HorasPrevistas;
            if (registro.Feriado || registro.AtestadoMedico)
            {
                horasPrevistas = 0;
            }

            return new RegistroPontoReadDto
            {
                Id = registro.Id,
                FuncionarioId = registro.FuncionarioId ?? registro.RegistroPontoId,
                Data = registro.Data.ToString("yyyy-MM-dd"),
                Entrada = RegistroPontoStatusRules.BloqueiaHorarios(registro) ? string.Empty : registro.HoraEntrada,
                AlmocInicio = RegistroPontoStatusRules.BloqueiaHorarios(registro) ? string.Empty : registro.HoraAlmocoInicio,
                AlmocFim = RegistroPontoStatusRules.BloqueiaHorarios(registro) ? string.Empty : registro.HoraAlmocoFim,
                Saida = RegistroPontoStatusRules.BloqueiaHorarios(registro) ? string.Empty : registro.HoraSaida,
                EntradaPlanejada = registro.Folga || registro.Ferias ? null : detalhe?.HoraInicio,
                SaidaPlanejada = registro.Folga || registro.Ferias ? null : detalhe?.HoraFim,
                HorasPrevistas = horasPrevistas,
                Presenca = registro.Presenca,
                Folga = registro.Folga,
                Feriado = registro.Feriado,
                AtestadoMedico = registro.AtestadoMedico,
                Ferias = registro.Ferias,
                Observacao = registro.Observacao,
                Status = RegistroPontoStatusRules.BuildStatus(registro, detalhe),
                EscalaId = registro.EscalaId,
                FuncionarioEscalaId = registro.FuncionarioEscalaId,
                FuncionarioName = registro.Funcionario?.Nome,
                CreatedByUserId = registro.CreatedByUserId,
                UpdatedByUserId = registro.UpdatedByUserId,
                StartDate = registro.StartDate,
                ChangeDate = registro.ChangeDate,
                Excluded = registro.Excluded
            };
        }
    }
}
