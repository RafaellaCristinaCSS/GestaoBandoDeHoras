using Portal.DTOs;

namespace Portal.Services
{
    public interface ICargoService
    {
        Task<IEnumerable<CargoReadDto>> GetAllAsync();
        Task<CargoReadDto> CreateAsync(CargoCreateDto dto);
    }
}
