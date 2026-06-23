using System;
using System.ComponentModel.DataAnnotations;

namespace Portal.Models
{
    public class AlteracaoEscalaAuditoria
    {
        [Key]
        public int Id { get; set; }

        public int FuncionarioId { get; set; }
        public Funcionario Funcionario { get; set; } = null!;

        public int? EscalaAnteriorId { get; set; }
        public int NovaEscalaId { get; set; }

        public DateTime DataVigencia { get; set; }
        public int UsuarioId { get; set; }
        public DateTime DataAlteracao { get; set; } = DateTime.UtcNow;

        public int TotalRegistrosAnalisados { get; set; }
        public int TotalRegistrosImpactados { get; set; }
        public int RegistrosAlteradosAutomaticamente { get; set; }
        public int RegistrosAlteradosManualmente { get; set; }
    }
}
