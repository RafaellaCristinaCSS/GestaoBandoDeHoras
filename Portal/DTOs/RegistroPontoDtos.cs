using System;

namespace Portal.DTOs
{
    public class RegistroPontoCreateDto
    {
        public int RegistroPontoId { get; set; }
        public DateTime Data { get; set; }
        public string? HoraEntrada { get; set; }
        public string? HoraAlmocoInicio { get; set; }
        public string? HoraAlmocoFim { get; set; }
        public string? HoraSaida { get; set; }
        public bool Presenca { get; set; }
        public string? Observacao { get; set; }

        public int CreatedByUserId { get; set; }
    }

    public class RegistroPontoUpdateDto
    {
        public int Id { get; set; }
        public int? RegistroPontoId { get; set; }
        public DateTime? Data { get; set; }
        public string? HoraEntrada { get; set; }
        public string? HoraAlmocoInicio { get; set; }
        public string? HoraAlmocoFim { get; set; }
        public string? HoraSaida { get; set; }
        public bool? Presenca { get; set; }
        public string? Observacao { get; set; }

        public int? UpdatedByUserId { get; set; }
    }

    public class RegistroPontoReadDto
    {
        public int Id { get; set; }
        public int RegistroPontoId { get; set; }
        public DateTime Data { get; set; }
        public string? HoraEntrada { get; set; }
        public string? HoraAlmocoInicio { get; set; }
        public string? HoraAlmocoFim { get; set; }
        public string? HoraSaida { get; set; }
        public bool Presenca { get; set; }
        public string? Observacao { get; set; }

        public string? FuncionarioName { get; set; }

        public int CreatedByUserId { get; set; }
        public int? UpdatedByUserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? ChangeDate { get; set; }
        public bool Excluded { get; set; }
    }
}
