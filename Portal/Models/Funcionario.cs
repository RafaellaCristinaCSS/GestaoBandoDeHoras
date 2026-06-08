using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Portal.Models
{
    public class Funcionario
    {
        [Key]
        public int Id { get; set; }
        public int FuncionarioId { get; set; }
        public string Nome { get; set; }
        public string Cargo { get; set; }
        public int CargaHorariaSemanal { get; set; }
        public bool Ativo { get; set; }
        public DateTime DataAdmissao { get; set; }
        public DateTime? DataDemissao { get; set; }


        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; } = false;
    }
}
