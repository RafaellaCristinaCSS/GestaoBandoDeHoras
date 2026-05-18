using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.DTOs;

namespace Portal.Services
{
    public interface IFuncionarioEscalaService
    {
        Task<IEnumerable<FuncionarioEscalaReadDto>> GetByFuncionarioIdAsync(int funcionarioId);
        Task<FuncionarioEscalaReadDto?> GetCurrentByFuncionarioIdAsync(int funcionarioId);
        Task<FuncionarioEscalaReadDto> AssignAsync(FuncionarioEscalaCreateDto dto);
        Task<bool> RemoveAsync(int id);
    }
}
