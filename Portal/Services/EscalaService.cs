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
                EscalaId = e.EscalaId,
                DiaSemana = e.DiaSemana,
                HoraInicio = e.HoraInicio,
                HoraFim = e.HoraFim,
                HorasPrevistas = e.HorasPrevistas,
                Folga = e.Folga,
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
                EscalaId = entity.EscalaId,
                DiaSemana = entity.DiaSemana,
                HoraInicio = entity.HoraInicio,
                HoraFim = entity.HoraFim,
                HorasPrevistas = entity.HorasPrevistas,
                Folga = entity.Folga,
                StartDate = entity.StartDate,
                ChangeDate = entity.ChangeDate,
                Excluded = entity.Excluded
            };
        }

        public async Task<EscalaReadDto> CreateAsync(EscalaCreateDto dto)
        {
            if (dto.EscalaId == null) throw new Exception("EscalaId é obrigatório!");
            if (dto.DiaSemana == null) throw new Exception("DiaSemana é obrigatório!");
            if (dto.HoraInicio == null) throw new Exception("HoraInicio é obrigatório!");
            if (dto.HoraFim == null) throw new Exception("HoraFim é obrigatório!");
            if (dto.HorasPrevistas == null) throw new Exception("HorasPrevistas é obrigatório!");
            if (dto.Folga == null) throw new Exception("Folga é obrigatório!");

            var entity = new Escala();

            // atribuição de campos
            entity.EscalaId = dto.EscalaId;
            entity.DiaSemana = dto.DiaSemana;
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

            if (dto.EscalaId != null)
                entity.EscalaId = dto.EscalaId ?? entity.EscalaId;
            entity.DiaSemana = dto.DiaSemana ?? entity.DiaSemana;
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
