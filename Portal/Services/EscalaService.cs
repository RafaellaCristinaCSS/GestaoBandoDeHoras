using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;

namespace Portal.Services
{
    public class EscalaService : IEscalaService
    {
        private readonly IEscalaRepository _repository;
        private readonly IEscalaDetalheRepository _detalheRepository;

        public EscalaService(IEscalaRepository repository, IEscalaDetalheRepository detalheRepository)
        {
            _repository = repository;
            _detalheRepository = detalheRepository;
        }

        private static EscalaReadDto ToReadDto(Escala e) => new EscalaReadDto
        {
            Id = e.Id,
            Nome = e.Nome,
            Descricao = e.Descricao,
            CargaHorariaSemanal = e.CargaHorariaSemanal,
            TipoEscala = e.TipoEscala,
            TrabalhaDiaParPadrao = e.TrabalhaDiaParPadrao,
            TurnoDoze36 = e.TurnoDoze36,
            Ativa = e.Ativa,
            CreatedAt = e.CreatedAt,
            Detalhes = e.Detalhes.Select(d => ToDetalheDto(d)).ToList()
        };

        private static EscalaDetalheReadDto ToDetalheDto(EscalaDetalhe d) => new EscalaDetalheReadDto
        {
            Id = d.Id,
            EscalaId = d.EscalaId,
            DiaSemana = d.DiaSemana,
            HoraInicio = d.HoraInicio,
            HoraFim = d.HoraFim,
            HoraAlmocoInicio = d.HoraAlmocoInicio,
            HoraAlmocoFim = d.HoraAlmocoFim,
            HorasPrevistas = d.HorasPrevistas,
            Folga = d.Folga
        };

        public async Task<IEnumerable<EscalaReadDto>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return list.Select(ToReadDto);
        }

        public async Task<EscalaReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;
            return ToReadDto(entity);
        }

        public async Task<EscalaReadDto> CreateAsync(EscalaCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                throw new Exception("Nome é obrigatório!");

            var entity = new Escala
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                CargaHorariaSemanal = dto.CargaHorariaSemanal,
                TipoEscala = dto.TipoEscala,
                TrabalhaDiaParPadrao = dto.TipoEscala == TipoEscala.Doze36 ? dto.TrabalhaDiaParPadrao : null,
                TurnoDoze36 = dto.TipoEscala == TipoEscala.Doze36 ? dto.TurnoDoze36 : null,
                Ativa = dto.Ativa,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var d in dto.Detalhes)
            {
                entity.Detalhes.Add(new EscalaDetalhe
                {
                    DiaSemana = d.DiaSemana,
                    HoraInicio = d.HoraInicio,
                    HoraFim = d.HoraFim,
                    HoraAlmocoInicio = d.HoraAlmocoInicio,
                    HoraAlmocoFim = d.HoraAlmocoFim,
                    HorasPrevistas = d.HorasPrevistas,
                    Folga = d.Folga
                });
            }

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            var created = await GetByIdAsync(entity.Id);
            return created!;
        }

        public async Task<bool> UpdateAsync(int id, EscalaUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            if (dto.Nome != null) entity.Nome = dto.Nome;
            if (dto.Descricao != null) entity.Descricao = dto.Descricao;
            if (dto.CargaHorariaSemanal != null) entity.CargaHorariaSemanal = dto.CargaHorariaSemanal.Value;
            if (dto.TipoEscala != null) entity.TipoEscala = dto.TipoEscala.Value;
            if (dto.TrabalhaDiaParPadrao != null || entity.TipoEscala != TipoEscala.Doze36)
                entity.TrabalhaDiaParPadrao = entity.TipoEscala == TipoEscala.Doze36 ? dto.TrabalhaDiaParPadrao : null;
            if (dto.TurnoDoze36 != null || entity.TipoEscala != TipoEscala.Doze36)
                entity.TurnoDoze36 = entity.TipoEscala == TipoEscala.Doze36 ? dto.TurnoDoze36 : null;
            if (dto.Ativa != null) entity.Ativa = dto.Ativa.Value;

            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            entity.Ativa = false;
            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();
            return true;
        }

        public async Task<EscalaDetalheReadDto> AddDetalheAsync(int escalaId, EscalaDetalheCreateDto dto)
        {
            var detalhe = new EscalaDetalhe
            {
                EscalaId = escalaId,
                DiaSemana = dto.DiaSemana,
                HoraInicio = dto.HoraInicio,
                HoraFim = dto.HoraFim,
                HoraAlmocoInicio = dto.HoraAlmocoInicio,
                HoraAlmocoFim = dto.HoraAlmocoFim,
                HorasPrevistas = dto.HorasPrevistas,
                Folga = dto.Folga
            };

            await _detalheRepository.AddAsync(detalhe);
            await _detalheRepository.SaveChangesAsync();

            return ToDetalheDto(detalhe);
        }

        public async Task<bool> UpdateDetalheAsync(int detalheId, EscalaDetalheUpdateDto dto)
        {
            var entity = await _detalheRepository.GetByIdAsync(detalheId);
            if (entity == null) return false;

            if (dto.HoraInicio != null) entity.HoraInicio = dto.HoraInicio;
            if (dto.HoraFim != null) entity.HoraFim = dto.HoraFim;
            if (dto.HoraAlmocoInicio != null) entity.HoraAlmocoInicio = dto.HoraAlmocoInicio;
            if (dto.HoraAlmocoFim != null) entity.HoraAlmocoFim = dto.HoraAlmocoFim;
            if (dto.HorasPrevistas != null) entity.HorasPrevistas = dto.HorasPrevistas.Value;
            if (dto.Folga != null) entity.Folga = dto.Folga.Value;

            await _detalheRepository.UpdateAsync(entity);
            await _detalheRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteDetalheAsync(int detalheId)
        {
            var entity = await _detalheRepository.GetByIdAsync(detalheId);
            if (entity == null) return false;

            await _detalheRepository.DeleteAsync(entity);
            await _detalheRepository.SaveChangesAsync();
            return true;
        }
    }
}
