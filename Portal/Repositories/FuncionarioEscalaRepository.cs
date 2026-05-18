using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.Data;
using Portal.Models;

namespace Portal.Repositories
{
    public interface IFuncionarioEscalaRepository
    {
        Task<FuncionarioEscala?> GetByIdAsync(int id);
        Task<IEnumerable<FuncionarioEscala>> GetByFuncionarioIdAsync(int funcionarioId);
        Task<FuncionarioEscala?> GetCurrentByFuncionarioIdAsync(int funcionarioId);
        Task<FuncionarioEscala?> GetWithEscalaAtDateAsync(int funcionarioId, DateTime date);
        Task AddAsync(FuncionarioEscala entity);
        Task UpdateAsync(FuncionarioEscala entity);
        Task SaveChangesAsync();
    }

    public class FuncionarioEscalaRepository : IFuncionarioEscalaRepository
    {
        private readonly AppDbContext _context;

        public FuncionarioEscalaRepository(AppDbContext context) => _context = context;

        public async Task<FuncionarioEscala?> GetByIdAsync(int id)
            => await _context.Set<FuncionarioEscala>()
                .Include(fe => fe.Funcionario)
                .Include(fe => fe.Escala).ThenInclude(e => e.Detalhes)
                .FirstOrDefaultAsync(fe => fe.Id == id);

        public async Task<IEnumerable<FuncionarioEscala>> GetByFuncionarioIdAsync(int funcionarioId)
            => await _context.Set<FuncionarioEscala>()
                .Include(fe => fe.Funcionario)
                .Include(fe => fe.Escala).ThenInclude(e => e.Detalhes)
                .Where(fe => fe.FuncionarioId == funcionarioId)
                .OrderByDescending(fe => fe.DataInicio)
                .ToListAsync();

        public async Task<FuncionarioEscala?> GetCurrentByFuncionarioIdAsync(int funcionarioId)
            => await _context.Set<FuncionarioEscala>()
                .Include(fe => fe.Escala).ThenInclude(e => e.Detalhes)
                .Where(fe => fe.FuncionarioId == funcionarioId && fe.DataFim == null)
                .FirstOrDefaultAsync();

        /// <summary>
        /// Retorna o vínculo (com Escala e Detalhes) que estava ativo em uma data específica.
        /// Isso garante que cálculos históricos usem a escala correta.
        /// </summary>
        public async Task<FuncionarioEscala?> GetWithEscalaAtDateAsync(int funcionarioId, DateTime date)
            => await _context.Set<FuncionarioEscala>()
                .Include(fe => fe.Escala).ThenInclude(e => e.Detalhes)
                .Where(fe => fe.FuncionarioId == funcionarioId
                    && fe.DataInicio <= date
                    && (fe.DataFim == null || fe.DataFim >= date))
                .OrderByDescending(fe => fe.DataInicio)
                .FirstOrDefaultAsync();

        public async Task AddAsync(FuncionarioEscala entity)
            => await _context.Set<FuncionarioEscala>().AddAsync(entity);

        public Task UpdateAsync(FuncionarioEscala entity)
        {
            _context.Set<FuncionarioEscala>().Update(entity);
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
