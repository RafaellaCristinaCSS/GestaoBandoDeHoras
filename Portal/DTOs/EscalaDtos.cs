using System;

namespace Portal.DTOs
{
    public class EscalaCreateDto
    {
        public int EscalaId { get; set; }
        public string DiaSemana { get; set; }
        public string HoraInicio { get; set; }
        public string HoraFim { get; set; }
        public decimal HorasPrevistas { get; set; }
        public bool Folga { get; set; }

        public int CreatedByUserId { get; set; }
    }

    public class EscalaUpdateDto
    {
        public int Id { get; set; }
        public int? EscalaId { get; set; }
        public string? DiaSemana { get; set; }
        public string? HoraInicio { get; set; }
        public string? HoraFim { get; set; }
        public decimal? HorasPrevistas { get; set; }
        public bool? Folga { get; set; }

        public int? UpdatedByUserId { get; set; }
    }

    public class EscalaReadDto
    {
        public int Id { get; set; }
        public int EscalaId { get; set; }
        public string DiaSemana { get; set; }
        public string HoraInicio { get; set; }
        public string HoraFim { get; set; }
        public decimal HorasPrevistas { get; set; }
        public bool Folga { get; set; }

        public string? FuncionarioName { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; }
    }
}
