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
            if (registro.Ferias)
                return "Férias";

            if (registro.Folga)
                return "Folga";

            if (!registro.Presenca)
                return "Falta";

            return "Presente";
        }

        public static void ApplyFerias(RegistroPonto registro)
        {
            registro.Ferias = true;
            registro.Presenca = false;
            registro.Folga = false;
            registro.Feriado = false;
            registro.AtestadoMedico = false;
            registro.HoraEntrada = string.Empty;
            registro.HoraAlmocoInicio = string.Empty;
            registro.HoraAlmocoFim = string.Empty;
            registro.HoraSaida = string.Empty;
        }
    }
}
