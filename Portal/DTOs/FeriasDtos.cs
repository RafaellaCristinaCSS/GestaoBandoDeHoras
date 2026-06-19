using System;

namespace Portal.DTOs
{
    public class FeriasCreateDto
    {
        public int FuncionarioId { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime DataFim { get; set; }
        public string? Observacao { get; set; }

        public int CreatedByUserId { get; set; }
    }

    public class FeriasUpdateDto
    {
        public int Id { get; set; }
        public int? FuncionarioId { get; set; }
        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public string? Observacao { get; set; }

        public int? UpdatedByUserId { get; set; }
    }

    public class FeriasReadDto
    {
        public int Id { get; set; }
        public int FuncionarioId { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime DataFim { get; set; }
        public string? Observacao { get; set; }

        public string? FuncionarioName { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; }
    }
}
