using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.DTOs;

namespace Portal.Services
{
    public interface IEscalaService
    {
        Task<IEnumerable<EscalaReadDto>> GetAllAsync();
        Task<EscalaReadDto?> GetByIdAsync(int id);
        Task<EscalaReadDto> CreateAsync(EscalaCreateDto dto);
        Task<bool> UpdateAsync(int id, EscalaUpdateDto dto);
        Task<bool> DeleteAsync(int id);
        Task<EscalaDetalheReadDto> AddDetalheAsync(int escalaId, EscalaDetalheCreateDto dto);
        Task<bool> UpdateDetalheAsync(int detalheId, EscalaDetalheUpdateDto dto);
        Task<bool> DeleteDetalheAsync(int detalheId);
    }
}

