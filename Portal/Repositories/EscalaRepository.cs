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
        Task AddAsync(Escala entity);
        Task UpdateAsync(Escala entity);
        Task SaveChangesAsync();
    }

    public class EscalaRepository : IEscalaRepository
    {
        private readonly AppDbContext _context;
        public EscalaRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Escala>> GetAllAsync()
            => await _context.Set<Escala>()
                .Include(x => x.Detalhes)
                .ToListAsync();

        public async Task<Escala?> GetByIdAsync(int id)
            => await _context.Set<Escala>()
                .Include(x => x.Detalhes)
                .FirstOrDefaultAsync(x => x.Id == id);

        public async Task AddAsync(Escala entity)
            => await _context.Set<Escala>().AddAsync(entity);

        public Task UpdateAsync(Escala entity)
        {
            _context.Set<Escala>().Update(entity);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }

    // ─── EscalaDetalhe ───────────────────────────────────────────────────────────

    public interface IEscalaDetalheRepository
    {
        Task<EscalaDetalhe?> GetByIdAsync(int id);
        Task AddAsync(EscalaDetalhe entity);
        Task UpdateAsync(EscalaDetalhe entity);
        Task DeleteAsync(EscalaDetalhe entity);
        Task SaveChangesAsync();
    }

    public class EscalaDetalheRepository : IEscalaDetalheRepository
    {
        private readonly AppDbContext _context;
        public EscalaDetalheRepository(AppDbContext context) => _context = context;

        public async Task<EscalaDetalhe?> GetByIdAsync(int id)
            => await _context.Set<EscalaDetalhe>().FirstOrDefaultAsync(x => x.Id == id);

        public async Task AddAsync(EscalaDetalhe entity)
            => await _context.Set<EscalaDetalhe>().AddAsync(entity);

        public Task UpdateAsync(EscalaDetalhe entity)
        {
            _context.Set<EscalaDetalhe>().Update(entity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(EscalaDetalhe entity)
        {
            _context.Set<EscalaDetalhe>().Remove(entity);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}

