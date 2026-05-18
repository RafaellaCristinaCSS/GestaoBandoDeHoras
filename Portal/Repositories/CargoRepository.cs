using Microsoft.EntityFrameworkCore;
using Portal.Data;
using Portal.Models;

namespace Portal.Repositories
{
    public interface ICargoRepository
    {
        Task<IEnumerable<Cargo>> GetAllAsync();
        Task<Cargo?> GetByNomeAsync(string nome);
        Task AddAsync(Cargo entity);
        Task SaveChangesAsync();
    }

    public class CargoRepository : ICargoRepository
    {
        private readonly AppDbContext _context;

        public CargoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Cargo>> GetAllAsync()
            => await _context.Set<Cargo>()
                .OrderBy(x => x.Nome)
                .ToListAsync();

        public async Task<Cargo?> GetByNomeAsync(string nome)
            => await _context.Set<Cargo>()
                .FirstOrDefaultAsync(x => x.Nome.ToLower() == nome.ToLower());

        public async Task AddAsync(Cargo entity)
        {
            await _context.Set<Cargo>().AddAsync(entity);
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
