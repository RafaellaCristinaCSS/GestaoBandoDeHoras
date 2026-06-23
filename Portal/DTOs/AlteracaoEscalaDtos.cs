using System;
using System.Collections.Generic;

namespace Portal.DTOs
{
    public class SimularAlteracaoEscalaDto
    {
        public int FuncionarioId { get; set; }
        public int NovaEscalaId { get; set; }
        public DateTime DataVigencia { get; set; }
        public bool? TrabalhaDiaPar { get; set; }
    }

    public class RegistroEstadoDto
    {
        public string Status { get; set; } = string.Empty;
        public string JornadaPrevista { get; set; } = string.Empty;
        public decimal? HorasPrevistas { get; set; }
        public string HorasPrevistasFormatadas { get; set; } = string.Empty;
        public string? Entrada { get; set; }
        public string? AlmocInicio { get; set; }
        public string? AlmocFim { get; set; }
        public string? Saida { get; set; }
        public decimal? HorasTrabalhadas { get; set; }
        public string HorasTrabalhadasFormatadas { get; set; } = string.Empty;
        public decimal? SaldoHoras { get; set; }
        public string SaldoHorasFormatado { get; set; } = string.Empty;
    }

    public class RegistroDivergenciaDto
    {
        public int RegistroId { get; set; }
        public string Data { get; set; } = string.Empty;
        public RegistroEstadoDto Antes { get; set; } = new();
        public RegistroEstadoDto NovaEscala { get; set; } = new();
        public RegistroEstadoDto ResultadoSugerido { get; set; } = new();
        public string SugestaoAutomatica { get; set; } = string.Empty;
        public bool PossuiDivergencia { get; set; }
    }

    public class SimulacaoAlteracaoEscalaResultDto
    {
        public int FuncionarioId { get; set; }
        public string FuncionarioNome { get; set; } = string.Empty;
        public int? EscalaAtualId { get; set; }
        public string EscalaAtualNome { get; set; } = string.Empty;
        public int NovaEscalaId { get; set; }
        public string NovaEscalaNome { get; set; } = string.Empty;
        public string DataVigencia { get; set; } = string.Empty;
        public int TotalRegistrosAnalisados { get; set; }
        public int TotalRegistrosImpactados { get; set; }
        public bool AfetaRegistrosHistoricos { get; set; }
        public string AvisoHistorico { get; set; } = string.Empty;
        public List<RegistroDivergenciaDto> Registros { get; set; } = new();
    }

    public class RegistroEstadoManualDto
    {
        public bool Presenca { get; set; }
        public bool Folga { get; set; }
        public bool Feriado { get; set; }
        public bool AtestadoMedico { get; set; }
        public bool Ferias { get; set; }
        public string? Entrada { get; set; }
        public string? AlmocInicio { get; set; }
        public string? AlmocFim { get; set; }
        public string? Saida { get; set; }
    }

    public class RegistroAlteracaoDecisaoDto
    {
        public int RegistroId { get; set; }
        public string Acao { get; set; } = "aplicar_sugestao";
        public RegistroEstadoManualDto? Manual { get; set; }
    }

    public class ConfirmarAlteracaoEscalaDto
    {
        public int FuncionarioId { get; set; }
        public int NovaEscalaId { get; set; }
        public DateTime DataVigencia { get; set; }
        public bool? TrabalhaDiaPar { get; set; }
        public int UsuarioId { get; set; }
        public List<RegistroAlteracaoDecisaoDto> Decisoes { get; set; } = new();
    }

    public class ConfirmarAlteracaoEscalaResultDto
    {
        public int AuditoriaId { get; set; }
        public int FuncionarioEscalaId { get; set; }
        public int RegistrosAlteradosAutomaticamente { get; set; }
        public int RegistrosAlteradosManualmente { get; set; }
    }
}
