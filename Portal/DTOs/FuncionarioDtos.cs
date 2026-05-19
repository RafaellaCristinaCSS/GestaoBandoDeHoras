using System;

namespace Portal.DTOs
{
    public class FuncionarioCreateDto
    {
        public int FuncionarioId { get; set; }
        public string Nome { get; set; }
        public string Cargo { get; set; }
        public int EscalaId { get; set; }
        public bool Ativo { get; set; }

        public int CreatedByUserId { get; set; }
    }

    public class FuncionarioUpdateDto
    {
        public int Id { get; set; }
        public int? FuncionarioId { get; set; }
        public string? Nome { get; set; }
        public string? Cargo { get; set; }
        public int? EscalaId { get; set; }
        public bool? Ativo { get; set; }

        public int? UpdatedByUserId { get; set; }
    }

    public class FuncionarioReadDto
    {
        public int Id { get; set; }
        public int FuncionarioId { get; set; }
        public string Nome { get; set; }
        public string Cargo { get; set; }
        public int CargaHorariaSemanal { get; set; }
        public int? EscalaId { get; set; }
        public string? EscalaNome { get; set; }
        public bool Ativo { get; set; }


        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; }
    }
}
