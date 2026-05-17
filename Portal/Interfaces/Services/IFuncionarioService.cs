using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.DTOs;

namespace Portal.Services
{
    public interface IFuncionarioService
    {
        Task<IEnumerable<FuncionarioReadDto>> GetAllAsync();
        Task<FuncionarioReadDto?> GetByIdAsync(int id);
        Task<FuncionarioReadDto> CreateAsync(FuncionarioCreateDto dto);
        Task<bool> UpdateAsync(int id, FuncionarioUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
