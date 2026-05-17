using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;

namespace Portal.Services
{
    public class FeriasService : IFeriasService
    {
        private readonly IFeriasRepository _repository;

        public FeriasService(IFeriasRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<FeriasReadDto>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return list.Select(e => new FeriasReadDto
            {
                Id = e.Id,
                FeriasId = e.FeriasId,
                DataInicio = e.DataInicio,
                DataFim = e.DataFim,
                Observacao = e.Observacao,
                StartDate = e.StartDate,
                ChangeDate = e.ChangeDate,
                Excluded = e.Excluded
            });
        }

        public async Task<FeriasReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return new FeriasReadDto
            {
                Id = entity.Id,
                FeriasId = entity.FeriasId,
                DataInicio = entity.DataInicio,
                DataFim = entity.DataFim,
                Observacao = entity.Observacao,
                StartDate = entity.StartDate,
                ChangeDate = entity.ChangeDate,
                Excluded = entity.Excluded
            };
        }

        public async Task<FeriasReadDto> CreateAsync(FeriasCreateDto dto)
        {
            if (dto.FeriasId == null) throw new Exception("FeriasId é obrigatório!");
            if (dto.DataInicio == null) throw new Exception("DataInicio é obrigatório!");
            if (dto.DataFim == null) throw new Exception("DataFim é obrigatório!");

            var entity = new Ferias();

            // atribuição de campos
            entity.FeriasId = dto.FeriasId;
            entity.DataInicio = dto.DataInicio;
            entity.DataFim = dto.DataFim;
            entity.Observacao = dto.Observacao;

            entity.StartDate = DateTime.UtcNow;
            entity.Excluded = false;

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            return await GetByIdAsync(entity.Id)!;
        }

        public async Task<bool> UpdateAsync(int id, FeriasUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            if (dto.FeriasId != null)
                entity.FeriasId = dto.FeriasId ?? entity.FeriasId;
            if (dto.DataInicio != null)
                entity.DataInicio = dto.DataInicio ?? entity.DataInicio;
            if (dto.DataFim != null)
                entity.DataFim = dto.DataFim ?? entity.DataFim;
            entity.Observacao = dto.Observacao ?? entity.Observacao;

            entity.ChangeDate = DateTime.UtcNow;
            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            entity.Excluded = true;
            entity.ChangeDate = DateTime.UtcNow;

            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();
            return true;
        }
    }
}
