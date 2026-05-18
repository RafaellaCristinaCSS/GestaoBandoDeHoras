using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Portal.Models
{
    public class EscalaDetalhe
    {
        [Key]
        public int Id { get; set; }

        public int EscalaId { get; set; }
        public Escala Escala { get; set; } = null!;

        /// <summary>0=Segunda, 1=Terça, 2=Quarta, 3=Quinta, 4=Sexta, 5=Sábado, 6=Domingo</summary>
        public int DiaSemana { get; set; }

        public string HoraInicio { get; set; } = string.Empty;
        public string HoraFim { get; set; } = string.Empty;
        public string? HoraAlmocoInicio { get; set; }
        public string? HoraAlmocoFim { get; set; }
        public decimal HorasPrevistas { get; set; }
        public bool Folga { get; set; }
    }
}
