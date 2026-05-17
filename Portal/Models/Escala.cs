using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Portal.Models
{
    public class Escala
    {
        [Key]
        public int Id { get; set; }
        public int EscalaId { get; set; }
        public string DiaSemana { get; set; }
        public string HoraInicio { get; set; }
        public string HoraFim { get; set; }
        public decimal HorasPrevistas { get; set; }
        public bool Folga { get; set; }

        public Funcionario? Funcionario { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; } = false;
    }
}
