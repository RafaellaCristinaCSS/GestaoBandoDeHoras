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
        public bool Presenca { get; set; } = true;
        public bool Feriado { get; set; } = false;
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
        public bool? Feriado { get; set; }
        public string? Observacao { get; set; }

        public int? UpdatedByUserId { get; set; }
    }

    public class RegistroPontoReadDto
    {
        public int Id { get; set; }
        public int FuncionarioId { get; set; }
        public string Data { get; set; }

        // Tempos reais (registrados pelo funcionário)
        public string? Entrada { get; set; }
        public string? AlmocInicio { get; set; }
        public string? AlmocFim { get; set; }
        public string? Saida { get; set; }

        // Tempos planejados (originados da escala histórica do registro)
        public string? EntradaPlanejada { get; set; }
        public string? SaidaPlanejada { get; set; }
        public decimal? HorasPrevistas { get; set; }

        public bool Presenca { get; set; }
        public bool Feriado { get; set; }
        public string? Observacao { get; set; }
        public string Status { get; set; } = "Falta";

        // Referências históricas da escala — imutáveis após criação
        public int? EscalaId { get; set; }
        public int? FuncionarioEscalaId { get; set; }

        public string? FuncionarioName { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; }
    }
}
