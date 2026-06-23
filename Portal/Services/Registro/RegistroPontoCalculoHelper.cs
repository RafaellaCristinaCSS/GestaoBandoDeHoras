using System;
using Portal.Models;

namespace Portal.Services.Registro
{
    internal static class RegistroPontoCalculoHelper
    {
        private static bool IsMarcacaoValida(string? hora)
            => !string.IsNullOrWhiteSpace(hora) && hora != "00:00";

        public static decimal? GetHorasTrabalhadas(RegistroPonto registro)
        {
            if (RegistroPontoStatusRules.BloqueiaHorarios(registro))
                return null;

            var marcacoes = new[]
            {
                ToMinutes(registro.HoraEntrada),
                ToMinutes(registro.HoraAlmocoInicio),
                ToMinutes(registro.HoraAlmocoFim),
                ToMinutes(registro.HoraSaida),
            };

            var validas = marcacoes.Where(m => m.HasValue).Select(m => m!.Value).ToList();
            if (validas.Count < 2)
                return null;

            var totalMinutos = 0;
            for (var i = 0; i + 1 < validas.Count; i += 2)
            {
                var inicio = validas[i];
                var fim = NormalizeRangeMinutes(inicio, validas[i + 1]);
                totalMinutos += fim - inicio;
            }

            return totalMinutos / 60m;
        }

        public static decimal? GetHorasPlanejadas(RegistroPonto registro, EscalaDetalhe? detalhe)
        {
            if (registro.Folga || registro.Ferias || registro.Feriado || registro.AtestadoMedico || !registro.Presenca)
                return 0;

            return detalhe?.HorasPrevistas;
        }

        public static decimal? GetSaldoHoras(RegistroPonto registro, EscalaDetalhe? detalhe)
        {
            var horasTrabalhadas = GetHorasTrabalhadas(registro);
            var horasPlanejadas = GetHorasPlanejadas(registro, detalhe);

            if (horasTrabalhadas == null || horasPlanejadas == null)
                return null;

            return horasTrabalhadas - horasPlanejadas;
        }

        public static string FormatHoras(decimal? horas, bool signed = false)
        {
            if (horas == null)
                return "-";

            var totalMinutes = (int)Math.Round(Math.Abs(horas.Value) * 60);
            var h = totalMinutes / 60;
            var m = totalMinutes % 60;
            var formatted = h < 100
                ? $"{h:D2}:{m:D2}"
                : $"{h}:{m:D2}";

            if (horas == 0)
                return signed ? "+00:00" : "00:00";

            if (signed)
                return horas > 0 ? $"+{formatted}" : $"-{formatted}";

            return horas < 0 ? $"-{formatted}" : formatted;
        }

        public static string FormatJornadaPrevista(EscalaDetalhe? detalhe)
        {
            if (detalhe == null)
                return "-";

            if (detalhe.Folga)
                return "Folga";

            if (string.IsNullOrWhiteSpace(detalhe.HoraInicio) || string.IsNullOrWhiteSpace(detalhe.HoraFim))
                return "-";

            return $"{detalhe.HoraInicio} às {detalhe.HoraFim}";
        }

        private static int? ToMinutes(string? time)
        {
            if (!IsMarcacaoValida(time))
                return null;

            var parts = time!.Split(':');
            if (parts.Length != 2)
                return null;

            if (!int.TryParse(parts[0], out var hours) || !int.TryParse(parts[1], out var minutes))
                return null;

            return hours * 60 + minutes;
        }

        private static int NormalizeRangeMinutes(int start, int end)
            => end <= start ? end + 24 * 60 : end;
    }
}
