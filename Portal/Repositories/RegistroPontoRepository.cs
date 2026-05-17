using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.Models;
using Portal.Data;
using Microsoft.EntityFrameworkCore;

namespace Portal.Repositories
{
    public interface IRegistroPontoRepository
    {
        Task<RegistroPonto?> GetByIdAsync(int id);
        Task<IEnumerable<RegistroPonto>> GetAllAsync();
        Task AddAsync(RegistroPonto entity);
        Task UpdateAsync(RegistroPonto entity);
        Task DeleteAsync(RegistroPonto entity);
        Task SaveChangesAsync();
    }

    public class RegistroPontoRepository : IRegistroPontoRepository
    {
        private readonly AppDbContext _context;
        public RegistroPontoRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<RegistroPonto>> GetAllAsync()
            => await _context.Set<RegistroPonto>().Include(x => x.Funcionario).ToListAsync();

public async Task<RegistroPonto?> GetByIdAsync(int id)
    => await _context.Set<RegistroPonto>().Include(x => x.Funcionario).FirstOrDefaultAsync(x => x.Id == id);

        public async Task AddAsync(RegistroPonto entity)
        {
            await _context.Set<RegistroPonto>().AddAsync(entity);
        }

        public Task UpdateAsync(RegistroPonto entity)
        {
            _context.Set<RegistroPonto>().Update(entity);
            return Task.CompletedTask;
        }

        public async Task DeleteAsync(RegistroPonto entity)
        {
            _context.Set<RegistroPonto>().Remove(entity);
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
