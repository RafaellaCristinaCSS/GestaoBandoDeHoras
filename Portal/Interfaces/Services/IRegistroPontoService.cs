using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.DTOs;

namespace Portal.Services
{
    public interface IRegistroPontoService
    {
        Task<IEnumerable<RegistroPontoReadDto>> GetAllAsync();
        Task<RegistroPontoReadDto?> GetByIdAsync(int id);
        Task<RegistroPontoReadDto> CreateAsync(RegistroPontoCreateDto dto);
        Task<bool> UpdateAsync(int id, RegistroPontoUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
