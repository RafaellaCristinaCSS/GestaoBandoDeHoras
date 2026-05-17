using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.Models;
using Portal.Data;
using Microsoft.EntityFrameworkCore;

namespace Portal.Repositories
{
    public interface IFeriasRepository
    {
        Task<Ferias?> GetByIdAsync(int id);
        Task<IEnumerable<Ferias>> GetAllAsync();
        Task AddAsync(Ferias entity);
        Task UpdateAsync(Ferias entity);
        Task DeleteAsync(Ferias entity);
        Task SaveChangesAsync();
    }

    public class FeriasRepository : IFeriasRepository
    {
        private readonly AppDbContext _context;
        public FeriasRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Ferias>> GetAllAsync()
            => await _context.Set<Ferias>().Include(x => x.Funcionario).ToListAsync();

public async Task<Ferias?> GetByIdAsync(int id)
    => await _context.Set<Ferias>().Include(x => x.Funcionario).FirstOrDefaultAsync(x => x.Id == id);

        public async Task AddAsync(Ferias entity)
        {
            await _context.Set<Ferias>().AddAsync(entity);
        }

        public Task UpdateAsync(Ferias entity)
        {
            _context.Set<Ferias>().Update(entity);
            return Task.CompletedTask;
        }

        public async Task DeleteAsync(Ferias entity)
        {
            _context.Set<Ferias>().Remove(entity);
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
