using Portal.Models;

namespace Portal.Services.Registro
{
    internal static class RegistroPontoStatusRules
    {
        public static bool HasMarcacaoReal(RegistroPonto registro)
            => !string.IsNullOrWhiteSpace(registro.HoraEntrada)
                || !string.IsNullOrWhiteSpace(registro.HoraAlmocoInicio)
                || !string.IsNullOrWhiteSpace(registro.HoraAlmocoFim)
                || !string.IsNullOrWhiteSpace(registro.HoraSaida);

        public static string BuildStatus(RegistroPonto registro, EscalaDetalhe? detalhe)
        {
            if (registro.Feriado)
                return "Feriado";
            if (registro.AtestadoMedico)
                return "Atestado Médico";

            if (registro.Folga)
                return "Folga";

            if (!registro.Presenca)
                return "Falta";

            return "Presente";
        }
    }
}
