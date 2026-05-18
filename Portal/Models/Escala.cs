using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Portal.Models
{
    /// <summary>
    /// Tipos de escala disponíveis.
    /// </summary>
    public enum TipoEscala
    {
        Semanal = 0,
        Doze36 = 1,
        Personalizada = 2
    }

    /// <summary>
    /// Template de jornada de trabalho (ex.: "44h semanais segunda a sexta").
    /// Funcionários são vinculados a uma escala via FuncionarioEscala.
    /// </summary>
    public class Escala
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Nome { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public decimal CargaHorariaSemanal { get; set; }

        public TipoEscala TipoEscala { get; set; } = TipoEscala.Semanal;

        public bool Ativa { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<EscalaDetalhe> Detalhes { get; set; } = new List<EscalaDetalhe>();
        public ICollection<FuncionarioEscala> FuncionarioEscalas { get; set; } = new List<FuncionarioEscala>();
    }
}
