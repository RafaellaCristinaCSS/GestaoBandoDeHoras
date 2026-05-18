using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.Models;
using Portal.Data;
using Microsoft.EntityFrameworkCore;

namespace Portal.Repositories
{
    public interface IEscalaRepository
    {
        Task<Escala?> GetByIdAsync(int id);
        Task<IEnumerable<Escala>> GetAllAsync();
        Task<IEnumerable<Escala>> GetByFuncionarioIdAsync(int funcionarioId);
        Task AddAsync(Escala entity);
        Task UpdateAsync(Escala entity);
        Task DeleteAsync(Escala entity);
        Task SaveChangesAsync();
    }

    public class EscalaRepository : IEscalaRepository
    {
        private readonly AppDbContext _context;
        public EscalaRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Escala>> GetAllAsync()
            => await _context.Set<Escala>().Include(x => x.Funcionario).ToListAsync();

        public async Task<IEnumerable<Escala>> GetByFuncionarioIdAsync(int funcionarioId)
            => await _context.Set<Escala>().Include(x => x.Funcionario)
                .Where(x => (x.FuncionarioId == funcionarioId || x.EscalaId == funcionarioId) && !x.Excluded)
                .ToListAsync();

public async Task<Escala?> GetByIdAsync(int id)
    => await _context.Set<Escala>().Include(x => x.Funcionario).FirstOrDefaultAsync(x => x.Id == id);

        public async Task AddAsync(Escala entity)
        {
            await _context.Set<Escala>().AddAsync(entity);
        }

        public Task UpdateAsync(Escala entity)
        {
            _context.Set<Escala>().Update(entity);
            return Task.CompletedTask;
        }

        public async Task DeleteAsync(Escala entity)
        {
            _context.Set<Escala>().Remove(entity);
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
