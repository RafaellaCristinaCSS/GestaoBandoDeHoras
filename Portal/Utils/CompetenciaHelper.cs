namespace Portal.Utils
{
    /// <summary>
    /// Utilitário para cálculo do período de competência.
    /// Regra: competência de um mês vai do dia 21 do mês anterior ao dia 20 do mês atual.
    /// Exemplo: competência Maio/2026 → 21/04/2026 até 20/05/2026.
    /// </summary>
    public static class CompetenciaHelper
    {
        public static (DateTime DataInicio, DateTime DataFim) ObterPeriodoCompetencia(int mes, int ano)
        {
            var dataInicio = new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc)
                .AddMonths(-1)
                .AddDays(20); // 1º do mês - 1 mês + 20 dias = dia 21 do mês anterior

            var dataFim = new DateTime(ano, mes, 20, 23, 59, 59, DateTimeKind.Utc);

            return (dataInicio, dataFim);
        }

        public static (DateTime DataInicio, DateTime DataFim) NormalizarPeriodo(DateTime dataInicio, DateTime dataFim)
        {
            var inicio = DateTime.SpecifyKind(dataInicio.Date, DateTimeKind.Utc);
            var fim = DateTime.SpecifyKind(dataFim.Date, DateTimeKind.Utc).AddDays(1).AddTicks(-1);

            if (fim < inicio)
                throw new ArgumentException("A data inicial não pode ser maior que a data final.");

            return (inicio, fim);
        }
    }
}
