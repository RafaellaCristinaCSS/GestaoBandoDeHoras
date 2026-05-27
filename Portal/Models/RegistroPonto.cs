using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Portal.Models
{
    public class RegistroPonto
    {
        [Key]
        public int Id { get; set; }
        public int RegistroPontoId { get; set; }
        public int? FuncionarioId { get; set; }
        public DateTime Data { get; set; }
        public string HoraEntrada { get; set; }
        public string HoraAlmocoInicio { get; set; }
        public string HoraAlmocoFim { get; set; }
        public string HoraSaida { get; set; }
        public bool Presenca { get; set; }
        public bool Feriado { get; set; }
        public bool AtestadoMedico { get; set; }
        public string Observacao { get; set; }

        /// <summary>Referência histórica da escala usada neste registro. NÃO muda com trocas futuras.</summary>
        public int? EscalaId { get; set; }
        public Escala? Escala { get; set; }

        /// <summary>Referência histórica do vínculo funcionário-escala ativo na data do registro.</summary>
        public int? FuncionarioEscalaId { get; set; }
        public FuncionarioEscala? FuncionarioEscalaVinculo { get; set; }

        public Funcionario? Funcionario { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; } = false;
    }
}
