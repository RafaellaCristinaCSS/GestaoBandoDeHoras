using Portal.DTOs;
using Portal.Models;

namespace Portal.Services.Registro
{
    internal static class RegistroPontoMapper
    {
        public static RegistroPontoReadDto ToReadDto(RegistroPonto registro)
        {
            var detalhe = RegistroPontoEscalaRules.ResolveDetalheParaRegistro(registro);
            var folgaManual = RegistroPontoStatusRules.IsFolgaManual(registro, detalhe);

            decimal? horasPrevistas = detalhe?.Folga == true || folgaManual ? 0 : detalhe?.HorasPrevistas;
            if (registro.Feriado || registro.AtestadoMedico)
            {
                horasPrevistas = 0;
            }

            return new RegistroPontoReadDto
            {
                Id = registro.Id,
                FuncionarioId = registro.FuncionarioId ?? registro.RegistroPontoId,
                Data = registro.Data.ToString("yyyy-MM-dd"),
                Entrada = registro.HoraEntrada,
                AlmocInicio = registro.HoraAlmocoInicio,
                AlmocFim = registro.HoraAlmocoFim,
                Saida = registro.HoraSaida,
                EntradaPlanejada = detalhe?.Folga == true || folgaManual ? null : detalhe?.HoraInicio,
                SaidaPlanejada = detalhe?.Folga == true || folgaManual ? null : detalhe?.HoraFim,
                HorasPrevistas = horasPrevistas,
                Presenca = registro.Presenca,
                Feriado = registro.Feriado,
                AtestadoMedico = registro.AtestadoMedico,
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
