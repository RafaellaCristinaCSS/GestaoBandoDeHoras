using System.Collections.Generic;
using System.Threading.Tasks;
using Portal.Models;
using Portal.Data;
using Microsoft.EntityFrameworkCore;

namespace Portal.Repositories
{
    public interface IFuncionarioRepository
    {
        Task<Funcionario?> GetByIdAsync(int id);
        Task<IEnumerable<Funcionario>> GetAllAsync();
        Task AddAsync(Funcionario entity);
        Task UpdateAsync(Funcionario entity);
        Task DeleteAsync(Funcionario entity);
        Task SaveChangesAsync();
    }

    public class FuncionarioRepository : IFuncionarioRepository
    {
        private readonly AppDbContext _context;
        public FuncionarioRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Funcionario>> GetAllAsync()
            => await _context.Set<Funcionario>()
                .OrderBy(x => x.Nome)
                .ToListAsync();

public async Task<Funcionario?> GetByIdAsync(int id)
    => await _context.Set<Funcionario>().FirstOrDefaultAsync(x => x.Id == id);

        public async Task AddAsync(Funcionario entity)
        {
            await _context.Set<Funcionario>().AddAsync(entity);
        }

        public Task UpdateAsync(Funcionario entity)
        {
            _context.Set<Funcionario>().Update(entity);
            return Task.CompletedTask;
        }

        public async Task DeleteAsync(Funcionario entity)
        {
            _context.Set<Funcionario>().Remove(entity);
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
