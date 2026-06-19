using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.Data;
using Portal.DTOs;
using Portal.Models;
using Portal.Repositories;
using Portal.Services.Registro;

namespace Portal.Services
{
    public class FeriasService : IFeriasService
    {
        private readonly IFeriasRepository _repository;
        private readonly IRegistroPontoRepository _registroPontoRepository;
        private readonly IFuncionarioEscalaRepository _funcionarioEscalaRepository;
        private readonly IFuncionarioRepository _funcionarioRepository;
        private readonly AppDbContext _context;

        public FeriasService(
            IFeriasRepository repository,
            IRegistroPontoRepository registroPontoRepository,
            IFuncionarioEscalaRepository funcionarioEscalaRepository,
            IFuncionarioRepository funcionarioRepository,
            AppDbContext context)
        {
            _repository = repository;
            _registroPontoRepository = registroPontoRepository;
            _funcionarioEscalaRepository = funcionarioEscalaRepository;
            _funcionarioRepository = funcionarioRepository;
            _context = context;
        }

        public async Task<IEnumerable<FeriasReadDto>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            return list.Select(MapToReadDto);
        }

        public async Task<FeriasReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? null : MapToReadDto(entity);
        }

        public async Task<FeriasReadDto> CreateAsync(FeriasCreateDto dto)
        {
            var dataInicio = ToUtcDate(dto.DataInicio);
            var dataFim = ToUtcDate(dto.DataFim);
            ValidateFerias(dto.FuncionarioId, dataInicio, dataFim);

            var funcionario = await _funcionarioRepository.GetByIdAsync(dto.FuncionarioId);
            if (funcionario == null)
                throw new ArgumentException("Funcionário não encontrado.");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var entity = new Ferias
                {
                    FuncionarioId = dto.FuncionarioId,
                    FeriasId = dto.FuncionarioId,
                    DataInicio = dataInicio,
                    DataFim = dataFim,
                    Observacao = dto.Observacao ?? string.Empty,
                    StartDate = DateTime.UtcNow,
                    Excluded = false
                };

                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();

                await SyncRegistroPontoAsync(entity.FuncionarioId, entity.DataInicio, entity.DataFim, applyFerias: true);

                await transaction.CommitAsync();

                var created = await GetByIdAsync(entity.Id);
                if (created == null)
                    throw new InvalidOperationException("Falha ao recuperar férias criadas.");

                return created;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> UpdateAsync(int id, FeriasUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            var funcionarioIdAnterior = entity.FuncionarioId;
            var dataInicioAnterior = ToUtcDate(entity.DataInicio);
            var dataFimAnterior = ToUtcDate(entity.DataFim);

            var funcionarioId = dto.FuncionarioId ?? entity.FuncionarioId;
            var dataInicio = ToUtcDate(dto.DataInicio ?? entity.DataInicio);
            var dataFim = ToUtcDate(dto.DataFim ?? entity.DataFim);

            ValidateFerias(funcionarioId, dataInicio, dataFim);

            var funcionario = await _funcionarioRepository.GetByIdAsync(funcionarioId);
            if (funcionario == null)
                throw new ArgumentException("Funcionário não encontrado.");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                entity.FuncionarioId = funcionarioId;
                entity.FeriasId = funcionarioId;
                entity.DataInicio = dataInicio;
                entity.DataFim = dataFim;
                entity.Observacao = dto.Observacao ?? entity.Observacao;
                entity.ChangeDate = DateTime.UtcNow;

                await _repository.UpdateAsync(entity);
                await _repository.SaveChangesAsync();

                var periodosAnteriores = EnumerateDays(dataInicioAnterior, dataFimAnterior).ToHashSet();
                var periodosNovos = EnumerateDays(dataInicio, dataFim).ToHashSet();

                var diasRemover = periodosAnteriores.Except(periodosNovos).ToList();
                var diasAplicar = periodosNovos.ToList();

                if (funcionarioIdAnterior != funcionarioId)
                {
                    await SyncRegistroPontoAsync(funcionarioIdAnterior, dataInicioAnterior, dataFimAnterior, applyFerias: false);
                }
                else if (diasRemover.Count > 0)
                {
                    await SyncRegistroPontoAsync(funcionarioIdAnterior, diasRemover.Min(), diasRemover.Max(), applyFerias: false, onlyDates: diasRemover);
                }

                await SyncRegistroPontoAsync(funcionarioId, dataInicio, dataFim, applyFerias: true, onlyDates: diasAplicar);

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                await SyncRegistroPontoAsync(entity.FuncionarioId, entity.DataInicio, entity.DataFim, applyFerias: false);

                entity.Excluded = true;
                entity.ChangeDate = DateTime.UtcNow;

                await _repository.UpdateAsync(entity);
                await _repository.SaveChangesAsync();

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static DateTime ToUtcDate(DateTime data)
            => DateTime.SpecifyKind(data.Date, DateTimeKind.Utc);

        private static void ValidateFerias(int funcionarioId, DateTime dataInicio, DateTime dataFim)
        {
            if (funcionarioId <= 0)
                throw new ArgumentException("Funcionário é obrigatório.");

            if (ToUtcDate(dataFim) < ToUtcDate(dataInicio))
                throw new ArgumentException("A data final deve ser maior ou igual à data inicial.");
        }

        private static IEnumerable<DateTime> EnumerateDays(DateTime inicio, DateTime fim)
        {
            var start = ToUtcDate(inicio);
            var end = ToUtcDate(fim);

            for (var data = start; data <= end; data = data.AddDays(1))
                yield return data;
        }

        private async Task SyncRegistroPontoAsync(
            int funcionarioId,
            DateTime dataInicio,
            DateTime dataFim,
            bool applyFerias,
            IReadOnlyCollection<DateTime>? onlyDates = null)
        {
            var dias = onlyDates ?? EnumerateDays(dataInicio, dataFim).ToList();
            if (dias.Count == 0)
                return;

            var inicio = dias.Min();
            var fim = dias.Max();

            var registrosExistentes = (await _registroPontoRepository.GetFilteredAsync(funcionarioId, null, null, inicio, fim))
                .GroupBy(r => r.Data.Date)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.Id).First());

            foreach (var dia in dias)
            {
                var dataUtc = ToUtcDate(dia);

                if (registrosExistentes.TryGetValue(dataUtc.Date, out var registro))
                {
                    if (applyFerias)
                        ApplyFeriasStatus(registro);
                    else
                        await RevertFeriasStatusAsync(registro, funcionarioId, dataUtc);

                    registro.ChangeDate = DateTime.UtcNow;
                    await _registroPontoRepository.UpdateAsync(registro);
                    continue;
                }

                if (!applyFerias)
                    continue;

                var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(funcionarioId, dataUtc);

                var novo = new RegistroPonto
                {
                    RegistroPontoId = funcionarioId,
                    FuncionarioId = funcionarioId,
                    Data = dataUtc,
                    HoraEntrada = string.Empty,
                    HoraAlmocoInicio = string.Empty,
                    HoraAlmocoFim = string.Empty,
                    HoraSaida = string.Empty,
                    Observacao = string.Empty,
                    EscalaId = vincEscala?.EscalaId,
                    FuncionarioEscalaId = vincEscala?.Id,
                    CreatedByUserId = 0,
                    StartDate = DateTime.UtcNow,
                    Excluded = false
                };

                ApplyFeriasStatus(novo);
                await _registroPontoRepository.AddAsync(novo);
            }

            await _registroPontoRepository.SaveChangesAsync();
        }

        private static void ApplyFeriasStatus(RegistroPonto registro)
        {
            registro.Ferias = true;
            registro.Presenca = false;
            registro.Folga = false;
            registro.Feriado = false;
            registro.AtestadoMedico = false;
        }

        private async Task RevertFeriasStatusAsync(RegistroPonto registro, int funcionarioId, DateTime data)
        {
            if (!registro.Ferias)
                return;

            registro.Ferias = false;

            if (registro.Feriado || registro.AtestadoMedico)
                return;

            var vincEscala = await _funcionarioEscalaRepository.GetWithEscalaAtDateAsync(funcionarioId, data);
            var detalhe = RegistroPontoEscalaRules.ResolveDetalheParaData(data, vincEscala);

            registro.EscalaId = vincEscala?.EscalaId;
            registro.FuncionarioEscalaId = vincEscala?.Id;

            RegistroPontoEscalaRules.ApplyEscala(registro, detalhe, sobrescreverHorarios: true, aplicarFolga: true);
        }

        private static FeriasReadDto MapToReadDto(Ferias entity) => new()
        {
            Id = entity.Id,
            FuncionarioId = entity.FuncionarioId,
            DataInicio = entity.DataInicio,
            DataFim = entity.DataFim,
            Observacao = entity.Observacao,
            FuncionarioName = entity.Funcionario?.Nome,
            StartDate = entity.StartDate,
            ChangeDate = entity.ChangeDate,
            Excluded = entity.Excluded
        };
    }
}
