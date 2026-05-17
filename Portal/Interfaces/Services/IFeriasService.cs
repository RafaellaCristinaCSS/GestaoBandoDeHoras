using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.DTOs;

namespace Portal.Services
{
    public interface IFeriasService
    {
        Task<IEnumerable<FeriasReadDto>> GetAllAsync();
        Task<FeriasReadDto?> GetByIdAsync(int id);
        Task<FeriasReadDto> CreateAsync(FeriasCreateDto dto);
        Task<bool> UpdateAsync(int id, FeriasUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
