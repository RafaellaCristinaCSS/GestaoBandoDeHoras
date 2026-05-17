using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;

namespace Portal.Services
{
    public class RegistroPontoService : IRegistroPontoService
    {
        private readonly IRegistroPontoRepository _repository;

        public RegistroPontoService(IRegistroPontoRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<RegistroPontoReadDto>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return list.Select(e => new RegistroPontoReadDto
            {
                Id = e.Id,
                RegistroPontoId = e.RegistroPontoId,
                Data = e.Data,
                HoraEntrada = e.HoraEntrada,
                HoraAlmocoInicio = e.HoraAlmocoInicio,
                HoraAlmocoFim = e.HoraAlmocoFim,
                HoraSaida = e.HoraSaida,
                Presenca = e.Presenca,
                Observacao = e.Observacao,
                StartDate = e.StartDate,
                ChangeDate = e.ChangeDate,
                Excluded = e.Excluded
            });
        }

        public async Task<RegistroPontoReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return new RegistroPontoReadDto
            {
                Id = entity.Id,
                RegistroPontoId = entity.RegistroPontoId,
                Data = entity.Data,
                HoraEntrada = entity.HoraEntrada,
                HoraAlmocoInicio = entity.HoraAlmocoInicio,
                HoraAlmocoFim = entity.HoraAlmocoFim,
                HoraSaida = entity.HoraSaida,
                Presenca = entity.Presenca,
                Observacao = entity.Observacao,
                StartDate = entity.StartDate,
                ChangeDate = entity.ChangeDate,
                Excluded = entity.Excluded
            };
        }

        public async Task<RegistroPontoReadDto> CreateAsync(RegistroPontoCreateDto dto)
        {
            if (dto.RegistroPontoId == null) throw new Exception("RegistroPontoId é obrigatório!");
            if (dto.Data == null) throw new Exception("Data é obrigatório!");
            if (dto.Presenca == null) throw new Exception("Presenca é obrigatório!");

            var entity = new RegistroPonto();

            // atribuição de campos
            entity.RegistroPontoId = dto.RegistroPontoId;
            entity.Data = dto.Data;
            entity.HoraEntrada = dto.HoraEntrada;
            entity.HoraAlmocoInicio = dto.HoraAlmocoInicio;
            entity.HoraAlmocoFim = dto.HoraAlmocoFim;
            entity.HoraSaida = dto.HoraSaida;
            entity.Presenca = dto.Presenca;
            entity.Observacao = dto.Observacao;

            entity.StartDate = DateTime.UtcNow;
            entity.Excluded = false;

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            return await GetByIdAsync(entity.Id)!;
        }

        public async Task<bool> UpdateAsync(int id, RegistroPontoUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            if (dto.RegistroPontoId != null)
                entity.RegistroPontoId = dto.RegistroPontoId ?? entity.RegistroPontoId;
            if (dto.Data != null)
                entity.Data = dto.Data ?? entity.Data;
            entity.HoraEntrada = dto.HoraEntrada ?? entity.HoraEntrada;
            entity.HoraAlmocoInicio = dto.HoraAlmocoInicio ?? entity.HoraAlmocoInicio;
            entity.HoraAlmocoFim = dto.HoraAlmocoFim ?? entity.HoraAlmocoFim;
            entity.HoraSaida = dto.HoraSaida ?? entity.HoraSaida;
            if (dto.Presenca != null)
                entity.Presenca = dto.Presenca ?? entity.Presenca;
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
