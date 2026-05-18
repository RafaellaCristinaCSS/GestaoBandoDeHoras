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
        private readonly IEscalaRepository _escalaRepository;

        private static int GetEscalaDiaSemana(DateTime data)
    => ((int)data.DayOfWeek + 6) % 7;
        private static void ApplyEscala(RegistroPonto registro, Escala? escala)
        {
            if (escala == null || escala.Folga)
            {
                return;
            }

            registro.HoraEntrada = string.IsNullOrWhiteSpace(registro.HoraEntrada) ? escala.HoraInicio : registro.HoraEntrada;
            registro.HoraAlmocoInicio = string.IsNullOrWhiteSpace(registro.HoraAlmocoInicio) ? (escala.HoraAlmocoInicio ?? string.Empty) : registro.HoraAlmocoInicio;
            registro.HoraAlmocoFim = string.IsNullOrWhiteSpace(registro.HoraAlmocoFim) ? (escala.HoraAlmocoFim ?? string.Empty) : registro.HoraAlmocoFim;
            registro.HoraSaida = string.IsNullOrWhiteSpace(registro.HoraSaida) ? escala.HoraFim : registro.HoraSaida;
        }

        private static string BuildStatus(RegistroPonto e)
        {
            if (!e.Presenca)
                return "Falta";

            return "Presente";
        }

        private static RegistroPontoReadDto ToReadDto(RegistroPonto e)
        {
            return new RegistroPontoReadDto
            {
                Id = e.Id,
                FuncionarioId = e.FuncionarioId ?? e.RegistroPontoId,
                Data = e.Data.ToString("yyyy-MM-dd"),
                Entrada = e.HoraEntrada,
                AlmocInicio = e.HoraAlmocoInicio,
                AlmocFim = e.HoraAlmocoFim,
                Saida = e.HoraSaida,
                Presenca = e.Presenca,
                Observacao = e.Observacao,
                Status = BuildStatus(e),
                FuncionarioName = e.Funcionario?.Nome,
                CreatedByUserId = e.CreatedByUserId,
                UpdatedByUserId = e.UpdatedByUserId,
                StartDate = e.StartDate,
                ChangeDate = e.ChangeDate,
                Excluded = e.Excluded
            };
        }

        public RegistroPontoService(IRegistroPontoRepository repository, IEscalaRepository escalaRepository)
        {
            _repository = repository;
            _escalaRepository = escalaRepository;
        }

        public async Task<IEnumerable<RegistroPontoReadDto>> GetAllAsync(int? funcionarioId = null, int? mes = null, int? ano = null)
        {
            if (funcionarioId.HasValue && mes.HasValue && ano.HasValue)
            {
                var registrosMes = (await _repository.GetFilteredAsync(funcionarioId, mes, ano)).ToList();
                var escalas = (await _escalaRepository.GetByFuncionarioIdAsync(funcionarioId.Value)).ToList();
                var dataInicio = new DateTime(ano.Value,mes.Value,1).AddMonths(-1).AddDays(20);

                var dataFim = new DateTime(ano.Value,mes.Value,1).AddDays(21);

                for (var dataAtual = dataInicio; dataAtual <= dataFim; dataAtual = dataAtual.AddDays(1))
                {
                    var data = new DateTime(
                        dataAtual.Year,
                        dataAtual.Month,
                        dataAtual.Day,
                        0,
                        0,  
                        0,
                        DateTimeKind.Utc);
                    var existe = registrosMes.Any(r => r.Data.Date == data.Date);
                    if (existe)
                        continue;

                    var novo = new RegistroPonto
                    {
                        FuncionarioId = funcionarioId.Value,
                        Data = data,
                        HoraEntrada = string.Empty,
                        HoraAlmocoInicio = string.Empty,
                        HoraAlmocoFim = string.Empty,
                        HoraSaida = string.Empty,
                        Presenca = true,
                        Observacao = string.Empty,
                        CreatedByUserId = 0,
                        StartDate = DateTime.UtcNow,
                        Excluded = false
                    };

                    var diaSemana = GetEscalaDiaSemana(data);
                    var escalaDoDia = escalas.FirstOrDefault(e => !e.Excluded && e.DiaSemana == diaSemana.ToString());
                    ApplyEscala(novo, escalaDoDia);

                    await _repository.AddAsync(novo);
                }

                await _repository.SaveChangesAsync();
            }

            var list = await _repository.GetFilteredAsync(funcionarioId, mes, ano);
            return list.Select(ToReadDto);
        }

        public async Task<RegistroPontoReadDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return null;

            return ToReadDto(entity);
        }

        public async Task<RegistroPontoReadDto> CreateAsync(RegistroPontoCreateDto dto)
        {
            if (dto.FuncionarioId <= 0) throw new Exception("FuncionarioId é obrigatório!");

            var escalas = (await _escalaRepository.GetByFuncionarioIdAsync(dto.FuncionarioId)).ToList();
            var diaSemana = GetEscalaDiaSemana(dto.Data);
            var escalaDoDia = escalas.FirstOrDefault(e => !e.Excluded && e.DiaSemana == diaSemana.ToString());

            var entity = new RegistroPonto();

            // atribuição de campos
            entity.RegistroPontoId = dto.FuncionarioId;
            entity.FuncionarioId = dto.FuncionarioId;
            entity.Data = dto.Data;
            entity.HoraEntrada = dto.Entrada ?? string.Empty;
            entity.HoraAlmocoInicio = dto.AlmocInicio ?? string.Empty;
            entity.HoraAlmocoFim = dto.AlmocFim ?? string.Empty;
            entity.HoraSaida = dto.Saida ?? string.Empty;
            entity.Presenca = dto.Presenca;
            entity.Observacao = dto.Observacao ?? string.Empty;

            ApplyEscala(entity, escalaDoDia);

            entity.StartDate = DateTime.UtcNow;
            entity.Excluded = false;

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            var created = await GetByIdAsync(entity.Id);
            if (created == null)
                throw new Exception("Falha ao recuperar o registro de ponto criado.");

            return created;
        }

        public async Task<bool> UpdateAsync(int id, RegistroPontoUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) return false;

            if (dto.FuncionarioId != null)
            {
                entity.RegistroPontoId = dto.FuncionarioId ?? entity.RegistroPontoId;
                entity.FuncionarioId = dto.FuncionarioId ?? entity.FuncionarioId;
            }
            if (dto.Data != null)
                entity.Data = dto.Data ?? entity.Data;
            entity.HoraEntrada = dto.Entrada ?? entity.HoraEntrada;
            entity.HoraAlmocoInicio = dto.AlmocInicio ?? entity.HoraAlmocoInicio;
            entity.HoraAlmocoFim = dto.AlmocFim ?? entity.HoraAlmocoFim;
            entity.HoraSaida = dto.Saida ?? entity.HoraSaida;
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
