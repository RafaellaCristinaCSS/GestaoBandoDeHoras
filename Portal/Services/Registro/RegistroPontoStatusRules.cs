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

        public static bool IsFolgaManual(RegistroPonto registro, EscalaDetalhe? detalhe = null)
            => !registro.Feriado
                && !registro.AtestadoMedico
                && !registro.Presenca
                && !HasMarcacaoReal(registro)
                && detalhe?.Folga != true;

        public static string BuildStatus(RegistroPonto registro, EscalaDetalhe? detalhe)
        {
            if (registro.Feriado)
                return "Feriado";
            if (registro.AtestadoMedico)
                return "Atestado Médico";

            if (detalhe?.Folga == true || IsFolgaManual(registro, detalhe))
                return "Folga";

            if (!registro.Presenca)
                return "Falta";

            return "Presente";
        }
    }
}
