using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.DTOs;

namespace Portal.Services
{
    public interface IRegistroPontoService
    {
        Task<IEnumerable<RegistroPontoReadDto>> GetAllAsync(int? funcionarioId = null, int? mes = null, int? ano = null, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task<RegistroPontoReadDto?> GetByIdAsync(int id);
        Task<RegistroPontoReadDto> CreateAsync(RegistroPontoCreateDto dto);
        Task<bool> UpdateAsync(int id, RegistroPontoUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
