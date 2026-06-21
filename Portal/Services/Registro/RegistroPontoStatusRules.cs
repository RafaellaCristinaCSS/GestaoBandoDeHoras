using Portal.Models;

namespace Portal.Services.Registro
{
    internal static class RegistroPontoStatusRules
    {
        internal readonly record struct StatusSnapshot(bool Ferias, bool AtestadoMedico, bool Feriado, bool Folga);

        public static bool HasMarcacaoReal(RegistroPonto registro)
            => !string.IsNullOrWhiteSpace(registro.HoraEntrada)
                || !string.IsNullOrWhiteSpace(registro.HoraAlmocoInicio)
                || !string.IsNullOrWhiteSpace(registro.HoraAlmocoFim)
                || !string.IsNullOrWhiteSpace(registro.HoraSaida);

        public static bool BloqueiaHorarios(RegistroPonto registro)
            => registro.Ferias || registro.AtestadoMedico;

        public static StatusSnapshot CaptureSnapshot(RegistroPonto registro)
            => new(registro.Ferias, registro.AtestadoMedico, registro.Feriado, registro.Folga);

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

        public static void ClearHorarios(RegistroPonto registro)
        {
            registro.HoraEntrada = string.Empty;
            registro.HoraAlmocoInicio = string.Empty;
            registro.HoraAlmocoFim = string.Empty;
            registro.HoraSaida = string.Empty;
        }

        public static void ApplyFerias(RegistroPonto registro)
        {
            registro.Ferias = true;
            registro.Presenca = false;
            registro.Folga = false;
            registro.Feriado = false;
            registro.AtestadoMedico = false;
            ClearHorarios(registro);
        }

        public static void ApplyAtestadoMedico(RegistroPonto registro)
        {
            registro.AtestadoMedico = true;
            registro.Presenca = false;
            registro.Folga = false;
            registro.Feriado = false;
            registro.Ferias = false;
            ClearHorarios(registro);
        }

        public static void EnforceMarcacaoRules(RegistroPonto registro, StatusSnapshot? statusAnterior)
        {
            if (registro.Ferias)
            {
                ApplyFerias(registro);
                return;
            }

            if (registro.AtestadoMedico)
            {
                ApplyAtestadoMedico(registro);
                return;
            }

            var virouFeriado = registro.Feriado && (statusAnterior == null || !statusAnterior.Value.Feriado);
            var virouFolga = registro.Folga && (statusAnterior == null || !statusAnterior.Value.Folga);

            if (virouFeriado)
            {
                registro.Presenca = false;
                registro.Folga = false;
                registro.Ferias = false;
                registro.AtestadoMedico = false;
                ClearHorarios(registro);
                return;
            }

            if (virouFolga)
            {
                registro.Presenca = false;
                registro.Feriado = false;
                registro.Ferias = false;
                registro.AtestadoMedico = false;
                ClearHorarios(registro);
            }
        }
    }
}
