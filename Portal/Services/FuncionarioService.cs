using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;

namespace Portal.Services
{
    public class FuncionarioService : IFuncionarioService
    {
        private readonly IFuncionarioRepository _repository;
        private readonly IEscalaService _escalaService;

        public FuncionarioService(IFuncionarioRepository repository, IEscalaService escalaService)
        {
            _repository = repository;
            _escalaService = escalaService;
        }

        public async Task<IEnumerable<FuncionarioReadDto>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return list.Select(e => new FuncionarioReadDto
            {
                Id = e.Id,
                FuncionarioId = e.FuncionarioId,
                Nome = e.Nome,
                Cargo = e.Cargo,
                CargaHorariaSemanal = e.CargaHorariaSemanal,
                Ativo = e.Ativo,
                StartDate = e.StartDate,
                ChangeDate = e.ChangeDate,
                Excluded = e.Excluded
            });
        }

        public async Task<FuncionarioReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return new FuncionarioReadDto
            {
                Id = entity.Id,
                FuncionarioId = entity.FuncionarioId,
                Nome = entity.Nome,
                Cargo = entity.Cargo,
                CargaHorariaSemanal = entity.CargaHorariaSemanal,
                Ativo = entity.Ativo,
                StartDate = entity.StartDate,
                ChangeDate = entity.ChangeDate,
                Excluded = entity.Excluded
            };
        }

        public async Task<FuncionarioReadDto> CreateAsync(FuncionarioCreateDto dto)
        {
            if (dto.FuncionarioId == null) throw new Exception("FuncionarioId é obrigatório!");
            if (dto.Nome == null) throw new Exception("Nome é obrigatório!");
            if (dto.Cargo == null) throw new Exception("Cargo é obrigatório!");
            if (dto.CargaHorariaSemanal == null) throw new Exception("CargaHorariaSemanal é obrigatório!");
            if (dto.Ativo == null) throw new Exception("Ativo é obrigatório!");

            var entity = new Funcionario();

            // atribuição de campos
            entity.FuncionarioId = dto.FuncionarioId;
            entity.Nome = dto.Nome;
            entity.Cargo = dto.Cargo;
            entity.CargaHorariaSemanal = dto.CargaHorariaSemanal;
            entity.Ativo = dto.Ativo;

            entity.StartDate = DateTime.UtcNow;
            entity.Excluded = false;

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            // Gerar escalas padrão para o novo funcionário
            await _escalaService.CreateEscalasPadraoAsync(entity.Id);

            return await GetByIdAsync(entity.Id)!;
        }

        public async Task<bool> UpdateAsync(int id, FuncionarioUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            if (dto.FuncionarioId != null)
                entity.FuncionarioId = dto.FuncionarioId ?? entity.FuncionarioId;
            entity.Nome = dto.Nome ?? entity.Nome;
            entity.Cargo = dto.Cargo ?? entity.Cargo;
            if (dto.CargaHorariaSemanal != null)
                entity.CargaHorariaSemanal = dto.CargaHorariaSemanal ?? entity.CargaHorariaSemanal;
            if (dto.Ativo != null)
                entity.Ativo = dto.Ativo ?? entity.Ativo;

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
