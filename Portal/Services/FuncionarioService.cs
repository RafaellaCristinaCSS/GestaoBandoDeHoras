using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portal.DTOs;
using Portal.Models;
using Portal.Enums;
using Portal.Data;
using Portal.Repositories;
using Portal.Utils;

namespace Portal.Services
{
    public class FuncionarioService : IFuncionarioService
    {
        private readonly IFuncionarioRepository _repository;
        private readonly IFuncionarioEscalaRepository _funcionarioEscalaRepository;
        private readonly IEscalaRepository _escalaRepository;
        private readonly AppDbContext _context;

        public FuncionarioService(
            IFuncionarioRepository repository,
            IFuncionarioEscalaRepository funcionarioEscalaRepository,
            IEscalaRepository escalaRepository,
            AppDbContext context)
        {
            _repository = repository;
            _funcionarioEscalaRepository = funcionarioEscalaRepository;
            _escalaRepository = escalaRepository;
            _context = context;
        }

        private static DateTime ObterInicioCompetenciaAtual(DateTime referencia)
        {
            var dataReferencia = referencia.Date;
            var mesCompetencia = dataReferencia.Day >= 21 ? dataReferencia.AddMonths(1) : dataReferencia;
            var (dataInicio, _) = CompetenciaHelper.ObterPeriodoCompetencia(mesCompetencia.Month, mesCompetencia.Year);
            return dataInicio.Date;
        }

        private static DateTime NormalizarDataUtc(DateTime data)
            => DateTime.SpecifyKind(data.Date, DateTimeKind.Utc);

        private static DateTime? NormalizarDataUtc(DateTime? data)
            => data.HasValue ? NormalizarDataUtc(data.Value) : null;

        private async Task<FuncionarioReadDto> ToReadDtoAsync(Funcionario entity)
        {
            var escalaAtual = await _funcionarioEscalaRepository.GetCurrentByFuncionarioIdAsync(entity.Id);

            return new FuncionarioReadDto
            {
                Id = entity.Id,
                FuncionarioId = entity.FuncionarioId,
                Nome = entity.Nome,
                Cargo = entity.Cargo,
                CargaHorariaSemanal = entity.CargaHorariaSemanal,
                EscalaId = escalaAtual?.EscalaId,
                EscalaNome = escalaAtual?.Escala?.Nome,
                DataAdmissao = entity.DataAdmissao,
                DataDemissao = entity.DataDemissao,
                StartDate = entity.StartDate,
                ChangeDate = entity.ChangeDate,
                Excluded = entity.Excluded
            };
        }

        public async Task<IEnumerable<FuncionarioReadDto>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            var result = new List<FuncionarioReadDto>();

            foreach (var funcionario in list)
            {
                result.Add(await ToReadDtoAsync(funcionario));
            }

            return result;
        }

        public async Task<FuncionarioReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return await ToReadDtoAsync(entity);
        }

        public async Task<FuncionarioReadDto> CreateAsync(FuncionarioCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome)) throw new Exception("Nome é obrigatório!");
            if (string.IsNullOrWhiteSpace(dto.Cargo)) throw new Exception("Cargo é obrigatório!");

            var escala = await _escalaRepository.GetByIdAsync(dto.EscalaId);
            if (escala == null) throw new Exception("Escala é obrigatória!");

            var entity = new Funcionario();

            var dataAdmissao = NormalizarDataUtc(dto.DataAdmissao);
            var dataDemissao = NormalizarDataUtc(dto.DataDemissao);

            if (dataDemissao.HasValue && dataDemissao.Value.Date < dataAdmissao.Date)
                throw new Exception("Data de demissão não pode ser anterior à data de admissão.");

            entity.FuncionarioId = dto.FuncionarioId;
            entity.Nome = dto.Nome;
            entity.Cargo = dto.Cargo;
            entity.CargaHorariaSemanal = (int)escala.CargaHorariaSemanal;
            entity.DataAdmissao = dataAdmissao;
            entity.DataDemissao = dataDemissao;
            entity.Ativo = !entity.DataDemissao.HasValue || entity.DataDemissao.Value.Date >= DateTime.UtcNow.Date;

            entity.StartDate = DateTime.UtcNow;
            entity.Excluded = false;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            var inicioCompetenciaAtual = ObterInicioCompetenciaAtual(DateTime.UtcNow);

            await _funcionarioEscalaRepository.AddAsync(new FuncionarioEscala
            {
                FuncionarioId = entity.Id,
                EscalaId = escala.Id,
                DataInicio = inicioCompetenciaAtual,
                TrabalhaDiaPar = escala.TipoEscala == TipoEscala.Doze36 ? escala.TrabalhaDiaParPadrao : null,
                CreatedByUserId = dto.CreatedByUserId
            });
            await _funcionarioEscalaRepository.SaveChangesAsync();

            await transaction.CommitAsync();

            return await GetByIdAsync(entity.Id)!;
        }

        public async Task<bool> UpdateAsync(int id, FuncionarioUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            Escala? novaEscala = null;
            var escalaAtual = await _funcionarioEscalaRepository.GetCurrentByFuncionarioIdAsync(entity.Id);

            if (dto.EscalaId.HasValue)
            {
                novaEscala = await _escalaRepository.GetByIdAsync(dto.EscalaId.Value);
                if (novaEscala == null) throw new Exception("Escala informada não foi encontrada.");
            }

            if (dto.FuncionarioId != null)
                entity.FuncionarioId = dto.FuncionarioId ?? entity.FuncionarioId;
            entity.Nome = dto.Nome ?? entity.Nome;
            entity.Cargo = dto.Cargo ?? entity.Cargo;
            if (dto.DataAdmissao.HasValue)
                entity.DataAdmissao = NormalizarDataUtc(dto.DataAdmissao.Value);
            if (dto.DataDemissao.HasValue)
                entity.DataDemissao = NormalizarDataUtc(dto.DataDemissao.Value);

            if (entity.DataDemissao.HasValue && entity.DataDemissao.Value.Date < entity.DataAdmissao.Date)
                throw new Exception("Data de demissão não pode ser anterior à data de admissão.");

            entity.Ativo = !entity.DataDemissao.HasValue || entity.DataDemissao.Value.Date >= DateTime.UtcNow.Date;

            if (novaEscala != null)
                entity.CargaHorariaSemanal = (int)novaEscala.CargaHorariaSemanal;

            entity.ChangeDate = DateTime.UtcNow;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            await _repository.UpdateAsync(entity);
            await _repository.SaveChangesAsync();

            if (novaEscala != null)
            {
                var hoje = DateTime.UtcNow.Date;
                var inicioCompetenciaAtual = ObterInicioCompetenciaAtual(DateTime.UtcNow);

                if (escalaAtual == null)
                {
                    await _funcionarioEscalaRepository.AddAsync(new FuncionarioEscala
                    {
                        FuncionarioId = entity.Id,
                        EscalaId = novaEscala.Id,
                        DataInicio = inicioCompetenciaAtual,
                        TrabalhaDiaPar = novaEscala.TipoEscala == TipoEscala.Doze36 ? novaEscala.TrabalhaDiaParPadrao : null,
                        CreatedByUserId = dto.UpdatedByUserId ?? 0
                    });
                }
                else if (escalaAtual.EscalaId != novaEscala.Id)
                {
                    if (escalaAtual.DataInicio.Date == hoje)
                    {
                        escalaAtual.EscalaId = novaEscala.Id;
                        escalaAtual.TrabalhaDiaPar = novaEscala.TipoEscala == TipoEscala.Doze36 ? novaEscala.TrabalhaDiaParPadrao : null;
                        await _funcionarioEscalaRepository.UpdateAsync(escalaAtual);
                    }
                    else
                    {
                        escalaAtual.DataFim = hoje.AddDays(-1);
                        await _funcionarioEscalaRepository.UpdateAsync(escalaAtual);

                        await _funcionarioEscalaRepository.AddAsync(new FuncionarioEscala
                        {
                            FuncionarioId = entity.Id,
                            EscalaId = novaEscala.Id,
                            DataInicio = hoje,
                            TrabalhaDiaPar = novaEscala.TipoEscala == TipoEscala.Doze36 ? novaEscala.TrabalhaDiaParPadrao : null,
                            CreatedByUserId = dto.UpdatedByUserId ?? 0
                        });
                    }
                }

                await _funcionarioEscalaRepository.SaveChangesAsync();
            }

            await transaction.CommitAsync();
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
