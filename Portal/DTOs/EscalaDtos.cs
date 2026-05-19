using System;
using System.Collections.Generic;
using Portal.Models;

namespace Portal.DTOs
{
    // ─── Escala (template) ───────────────────────────────────────────────────────

    public class EscalaCreateDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public decimal CargaHorariaSemanal { get; set; }
        public TipoEscala TipoEscala { get; set; } = TipoEscala.Semanal;
        public bool? TrabalhaDiaParPadrao { get; set; }
        public TurnoEscala? TurnoDoze36 { get; set; }
        public bool Ativa { get; set; } = true;
        public List<EscalaDetalheCreateDto> Detalhes { get; set; } = new();
    }

    public class EscalaUpdateDto
    {
        public string? Nome { get; set; }
        public string? Descricao { get; set; }
        public decimal? CargaHorariaSemanal { get; set; }
        public TipoEscala? TipoEscala { get; set; }
        public bool? TrabalhaDiaParPadrao { get; set; }
        public TurnoEscala? TurnoDoze36 { get; set; }
        public bool? Ativa { get; set; }
    }

    public class EscalaReadDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public decimal CargaHorariaSemanal { get; set; }
        public TipoEscala TipoEscala { get; set; }
        public bool? TrabalhaDiaParPadrao { get; set; }
        public TurnoEscala? TurnoDoze36 { get; set; }
        public bool Ativa { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<EscalaDetalheReadDto> Detalhes { get; set; } = new();
    }

    // ─── EscalaDetalhe ───────────────────────────────────────────────────────────

    public class EscalaDetalheCreateDto
    {
        public int DiaSemana { get; set; }
        public string HoraInicio { get; set; } = string.Empty;
        public string HoraFim { get; set; } = string.Empty;
        public string? HoraAlmocoInicio { get; set; }
        public string? HoraAlmocoFim { get; set; }
        public decimal HorasPrevistas { get; set; }
        public bool Folga { get; set; }
    }

    public class EscalaDetalheUpdateDto
    {
        public string? HoraInicio { get; set; }
        public string? HoraFim { get; set; }
        public string? HoraAlmocoInicio { get; set; }
        public string? HoraAlmocoFim { get; set; }
        public decimal? HorasPrevistas { get; set; }
        public bool? Folga { get; set; }
    }

    public class EscalaDetalheReadDto
    {
        public int Id { get; set; }
        public int EscalaId { get; set; }
        public int DiaSemana { get; set; }
        public string HoraInicio { get; set; } = string.Empty;
        public string HoraFim { get; set; } = string.Empty;
        public string? HoraAlmocoInicio { get; set; }
        public string? HoraAlmocoFim { get; set; }
        public decimal HorasPrevistas { get; set; }
        public bool Folga { get; set; }
    }
}

