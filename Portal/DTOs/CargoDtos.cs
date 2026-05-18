namespace Portal.DTOs
{
    public class CargoCreateDto
    {
        public string Nome { get; set; } = string.Empty;
    }

    public class CargoReadDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
    }
}
