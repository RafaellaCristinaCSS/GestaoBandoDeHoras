using System.ComponentModel.DataAnnotations;

namespace Portal.Models
{
    public class Cargo
    {
        [Key]
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
    }
}
