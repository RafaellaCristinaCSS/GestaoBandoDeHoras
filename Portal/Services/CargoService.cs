using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;

namespace Portal.Services
{
    public class CargoService : ICargoService
    {
        private readonly ICargoRepository _repository;

        public CargoService(ICargoRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<CargoReadDto>> GetAllAsync()
        {
            var list = (await _repository.GetAllAsync())
                .OrderBy(x => x.Nome, StringComparer.CurrentCultureIgnoreCase)
                .ThenBy(x => x.Nome);

            return list.Select(x => new CargoReadDto
            {
                Id = x.Id,
                Nome = x.Nome
            });
        }

        public async Task<CargoReadDto> CreateAsync(CargoCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                throw new Exception("Nome do cargo é obrigatório!");

            var nomeNormalizado = dto.Nome.Trim();
            var existente = await _repository.GetByNomeAsync(nomeNormalizado);
            if (existente != null)
            {
                return new CargoReadDto
                {
                    Id = existente.Id,
                    Nome = existente.Nome
                };
            }

            var entity = new Cargo
            {
                Nome = nomeNormalizado
            };

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            return new CargoReadDto
            {
                Id = entity.Id,
                Nome = entity.Nome
            };
        }
    }
}
