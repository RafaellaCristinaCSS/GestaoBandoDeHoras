using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;

namespace Portal.Services
{
    public class EscalaService : IEscalaService
    {
        private readonly IEscalaRepository _repository;

        private static int ParseDiaSemana(string value)
            => int.TryParse(value, out var diaSemana) ? diaSemana : 0;

        public EscalaService(IEscalaRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<EscalaReadDto>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return list.Select(e => new EscalaReadDto
            {
                Id = e.Id,
                FuncionarioId = e.FuncionarioId ?? e.EscalaId,
                DiaSemana = ParseDiaSemana(e.DiaSemana),
                HoraInicio = e.HoraInicio,
                HoraFim = e.HoraFim,
                HorasPrevistas = e.HorasPrevistas,
                Folga = e.Folga,
                FuncionarioName = e.Funcionario?.Nome,
                StartDate = e.StartDate,
                ChangeDate = e.ChangeDate,
                Excluded = e.Excluded
            });
        }

        public async Task<IEnumerable<EscalaReadDto>> GetByFuncionarioAsync(int funcionarioId)
        {
            var list = await _repository.GetByFuncionarioIdAsync(funcionarioId);
            return list.Select(e => new EscalaReadDto
            {
                Id = e.Id,
                FuncionarioId = e.FuncionarioId ?? e.EscalaId,
                DiaSemana = ParseDiaSemana(e.DiaSemana),
                HoraInicio = e.HoraInicio,
                HoraFim = e.HoraFim,
                HorasPrevistas = e.HorasPrevistas,
                Folga = e.Folga,
                FuncionarioName = e.Funcionario?.Nome,
                StartDate = e.StartDate,
                ChangeDate = e.ChangeDate,
                Excluded = e.Excluded
            });
        }

        public async Task<EscalaReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return new EscalaReadDto
            {
                Id = entity.Id,
                FuncionarioId = entity.FuncionarioId ?? entity.EscalaId,
                DiaSemana = ParseDiaSemana(entity.DiaSemana),
                HoraInicio = entity.HoraInicio,
                HoraFim = entity.HoraFim,
                HorasPrevistas = entity.HorasPrevistas,
                Folga = entity.Folga,
                FuncionarioName = entity.Funcionario?.Nome,
                StartDate = entity.StartDate,
                ChangeDate = entity.ChangeDate,
                Excluded = entity.Excluded
            };
        }

        public async Task<EscalaReadDto> CreateAsync(EscalaCreateDto dto)
        {
            if (dto.FuncionarioId <= 0) throw new Exception("FuncionarioId é obrigatório!");
            if (dto.HoraInicio == null) throw new Exception("HoraInicio é obrigatório!");
            if (dto.HoraFim == null) throw new Exception("HoraFim é obrigatório!");

            var entity = new Escala();

            // atribuição de campos
            entity.EscalaId = dto.FuncionarioId;
            entity.FuncionarioId = dto.FuncionarioId;
            entity.DiaSemana = dto.DiaSemana.ToString();
            entity.HoraInicio = dto.HoraInicio;
            entity.HoraFim = dto.HoraFim;
            entity.HorasPrevistas = dto.HorasPrevistas;
            entity.Folga = dto.Folga;

            entity.StartDate = DateTime.UtcNow;
            entity.Excluded = false;

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            return await GetByIdAsync(entity.Id)!;
        }

        public async Task<bool> UpdateAsync(int id, EscalaUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            if (dto.FuncionarioId != null)
            {
                entity.EscalaId = dto.FuncionarioId ?? entity.EscalaId;
                entity.FuncionarioId = dto.FuncionarioId ?? entity.FuncionarioId;
            }
            if (dto.DiaSemana != null)
                entity.DiaSemana = dto.DiaSemana.Value.ToString();
            entity.HoraInicio = dto.HoraInicio ?? entity.HoraInicio;
            entity.HoraFim = dto.HoraFim ?? entity.HoraFim;
            if (dto.HorasPrevistas != null)
                entity.HorasPrevistas = dto.HorasPrevistas ?? entity.HorasPrevistas;
            if (dto.Folga != null)
                entity.Folga = dto.Folga ?? entity.Folga;

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
