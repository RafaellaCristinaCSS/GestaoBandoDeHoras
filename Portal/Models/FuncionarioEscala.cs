using System;
using System.ComponentModel.DataAnnotations;

namespace Portal.Models
{
    public class FuncionarioEscala
    {
        [Key]
        public int Id { get; set; }

        public int FuncionarioId { get; set; }
        public Funcionario Funcionario { get; set; } = null!;

        public int EscalaId { get; set; }
        public Escala Escala { get; set; } = null!;

        public DateTime DataInicio { get; set; }

        /// <summary>Nulo significa que a escala está ativa atualmente.</summary>
        public DateTime? DataFim { get; set; }

        /// <summary>
        /// Para escala 12x36, define se este funcionário trabalha em dias pares (true) ou ímpares (false).
        /// Nulo para escalas que não usam essa regra.
        /// </summary>
        public bool? TrabalhaDiaPar { get; set; }

        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
