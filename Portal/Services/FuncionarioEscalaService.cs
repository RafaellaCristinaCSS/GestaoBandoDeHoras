using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;

namespace Portal.Services
{
    public class FuncionarioEscalaService : IFuncionarioEscalaService
    {
        private readonly IFuncionarioEscalaRepository _repository;
        private readonly IEscalaRepository _escalaRepository;

        public FuncionarioEscalaService(IFuncionarioEscalaRepository repository, IEscalaRepository escalaRepository)
        {
            _repository = repository;
            _escalaRepository = escalaRepository;
        }

        private static FuncionarioEscalaReadDto ToReadDto(FuncionarioEscala fe) => new FuncionarioEscalaReadDto
        {
            Id = fe.Id,
            FuncionarioId = fe.FuncionarioId,
            FuncionarioNome = fe.Funcionario?.Nome,
            EscalaId = fe.EscalaId,
            EscalaNome = fe.Escala?.Nome,
            DataInicio = fe.DataInicio,
            DataFim = fe.DataFim,
            TrabalhaDiaPar = fe.TrabalhaDiaPar,
            CreatedByUserId = fe.CreatedByUserId,
            CreatedAt = fe.CreatedAt
        };

        public async Task<IEnumerable<FuncionarioEscalaReadDto>> GetByFuncionarioIdAsync(int funcionarioId)
        {
            var list = await _repository.GetByFuncionarioIdAsync(funcionarioId);
            return list.Select(ToReadDto);
        }

        public async Task<FuncionarioEscalaReadDto?> GetCurrentByFuncionarioIdAsync(int funcionarioId)
        {
            var entity = await _repository.GetCurrentByFuncionarioIdAsync(funcionarioId);
            if (entity == null) return null;
            return ToReadDto(entity);
        }

        /// <summary>
        /// Atribui uma nova escala ao funcionário. Fecha automaticamente o vínculo ativo anterior.
        /// </summary>
        public async Task<FuncionarioEscalaReadDto> AssignAsync(FuncionarioEscalaCreateDto dto)
        {
            var escala = await _escalaRepository.GetByIdAsync(dto.EscalaId);
            if (escala == null)
                throw new ArgumentException("Escala não encontrada.");

            var trabalhaDiaPar = dto.TrabalhaDiaPar ?? escala.TrabalhaDiaParPadrao;

            if (escala.TipoEscala == TipoEscala.Doze36 && !trabalhaDiaPar.HasValue)
                throw new ArgumentException("Para escala 12x36, é obrigatório informar se o funcionário trabalha em dias pares ou ímpares.");

            // Fechar o vínculo atual (se existir)
            var atual = await _repository.GetCurrentByFuncionarioIdAsync(dto.FuncionarioId);
            if (atual != null)
            {
                atual.DataFim = dto.DataInicio.AddDays(-1);
                await _repository.UpdateAsync(atual);
            }

            var entity = new FuncionarioEscala
            {
                FuncionarioId = dto.FuncionarioId,
                EscalaId = dto.EscalaId,
                DataInicio = dto.DataInicio,
                DataFim = null,
                TrabalhaDiaPar = escala.TipoEscala == TipoEscala.Doze36 ? trabalhaDiaPar : null,
                CreatedByUserId = dto.CreatedByUserId,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            var created = await _repository.GetByIdAsync(entity.Id);
            return ToReadDto(created!);
        }

        public async Task<bool> RemoveAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            // Reabrir o vínculo anterior (se existir) ao remover o atual
            var anterior = (await _repository.GetByFuncionarioIdAsync(entity.FuncionarioId))
                .FirstOrDefault(fe => fe.Id != id && fe.DataFim.HasValue);

            if (entity.DataFim == null && anterior != null)
                anterior.DataFim = null;

            // Soft-delete: define DataFim como hoje
            entity.DataFim = DateTime.UtcNow.Date;
            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();
            return true;
        }
    }
}
