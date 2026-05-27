using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Portal.Models;
using Portal.Data;
using Portal.Utils;
using Microsoft.EntityFrameworkCore;

namespace Portal.Repositories
{
    public interface IRegistroPontoRepository
    {
        Task<RegistroPonto?> GetByIdAsync(int id);
        Task<IEnumerable<RegistroPonto>> GetAllAsync();
        Task<IEnumerable<RegistroPonto>> GetFilteredAsync(int? funcionarioId, int? mes, int? ano, DateTime? dataInicio = null, DateTime? dataFim = null);
        Task AddAsync(RegistroPonto entity);
        Task UpdateAsync(RegistroPonto entity);
        Task DeleteAsync(RegistroPonto entity);
        Task SaveChangesAsync();
    }

    public class RegistroPontoRepository : IRegistroPontoRepository
    {
        private readonly AppDbContext _context;
        public RegistroPontoRepository(AppDbContext context) => _context = context;

        private static IQueryable<RegistroPonto> WithIncludes(IQueryable<RegistroPonto> q)
            => q.Include(x => x.Funcionario)
                .Include(x => x.Escala).ThenInclude(e => e!.Detalhes)
                .Include(x => x.FuncionarioEscalaVinculo);

        public async Task<IEnumerable<RegistroPonto>> GetAllAsync()
            => await WithIncludes(_context.Set<RegistroPonto>().Where(x => !x.Excluded)).ToListAsync();

        public async Task<IEnumerable<RegistroPonto>> GetFilteredAsync(int? funcionarioId, int? mes, int? ano, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var query = WithIncludes(_context.Set<RegistroPonto>().Where(x => !x.Excluded));

            if (funcionarioId.HasValue)
            {
                var id = funcionarioId.Value;
                query = query.Where(x => x.FuncionarioId == id);
            }

            if (dataInicio.HasValue && dataFim.HasValue)
            {
                var (inicio, fim) = CompetenciaHelper.NormalizarPeriodo(dataInicio.Value, dataFim.Value);
                query = query.Where(x => x.Data >= inicio && x.Data <= fim);
            }
            else if (mes.HasValue && ano.HasValue)
            {
                var (inicioCompetencia, fimCompetencia) = CompetenciaHelper.ObterPeriodoCompetencia(mes.Value, ano.Value);
                query = query.Where(x => x.Data >= inicioCompetencia && x.Data <= fimCompetencia);
            }
            else
            {
                if (mes.HasValue)
                    query = query.Where(x => x.Data.Month == mes.Value);

                if (ano.HasValue)
                    query = query.Where(x => x.Data.Year == ano.Value);
            }

            return await query.OrderBy(x => x.Data).ToListAsync();
        }

        public async Task<RegistroPonto?> GetByIdAsync(int id)
            => await WithIncludes(_context.Set<RegistroPonto>()).FirstOrDefaultAsync(x => x.Id == id);

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
