using System;

namespace Portal.DTOs
{
    public class FuncionarioEscalaCreateDto
    {
        public int FuncionarioId { get; set; }
        public int EscalaId { get; set; }
        public DateTime DataInicio { get; set; }
        public bool? TrabalhaDiaPar { get; set; }
        public int CreatedByUserId { get; set; }
    }

    public class FuncionarioEscalaReadDto
    {
        public int Id { get; set; }
        public int FuncionarioId { get; set; }
        public string? FuncionarioNome { get; set; }
        public int EscalaId { get; set; }
        public string? EscalaNome { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public bool? TrabalhaDiaPar { get; set; }
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
