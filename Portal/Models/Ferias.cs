using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Portal.Models
{
    public class Ferias
    {
        [Key]
        public int Id { get; set; }
        public int FeriasId { get; set; }
        public int FuncionarioId { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime DataFim { get; set; }
        public string Observacao { get; set; }

        public Funcionario? Funcionario { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; } = false;
    }
}
