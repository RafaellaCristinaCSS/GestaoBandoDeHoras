using System;

namespace Portal.DTOs
{
    public class RegistroPontoCreateDto
    {
        public int FuncionarioId { get; set; }
        public DateTime Data { get; set; }
        public string? Entrada { get; set; }
        public string? AlmocInicio { get; set; }
        public string? AlmocFim { get; set; }
        public string? Saida { get; set; }
        public bool Presenca { get; set; }
        public string? Observacao { get; set; }

        public int CreatedByUserId { get; set; }
    }

    public class RegistroPontoUpdateDto
    {
        public int Id { get; set; }
        public int? FuncionarioId { get; set; }
        public DateTime? Data { get; set; }
        public string? Entrada { get; set; }
        public string? AlmocInicio { get; set; }
        public string? AlmocFim { get; set; }
        public string? Saida { get; set; }
        public bool? Presenca { get; set; }
        public string? Observacao { get; set; }

        public int? UpdatedByUserId { get; set; }
    }

    public class RegistroPontoReadDto
    {
        public int Id { get; set; }
        public int FuncionarioId { get; set; }
        public DateTime Data { get; set; }
        public string? Entrada { get; set; }
        public string? AlmocInicio { get; set; }
        public string? AlmocFim { get; set; }
        public string? Saida { get; set; }
        public bool Presenca { get; set; }
        public string? Observacao { get; set; }
        public string Status { get; set; } = "Falta";

        public string? FuncionarioName { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; }
    }
}
