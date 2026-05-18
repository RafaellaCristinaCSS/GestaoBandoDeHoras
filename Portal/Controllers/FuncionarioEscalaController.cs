using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Portal.Services;
using Portal.DTOs;

namespace Portal.Controllers
{
    [ApiController]
    [Route("api/funcionario-escalas")]
    [Authorize(Policy = "Public")]
    public class FuncionarioEscalaController : ControllerBase
    {
        private readonly IFuncionarioEscalaService _service;

        public FuncionarioEscalaController(IFuncionarioEscalaService service)
        {
            _service = service;
        }

        [HttpGet("funcionario/{funcionarioId}")]
        public async Task<IActionResult> GetByFuncionario(int funcionarioId)
        {
            var result = await _service.GetByFuncionarioIdAsync(funcionarioId);
            return Ok(result);
        }

        [HttpGet("funcionario/{funcionarioId}/atual")]
        public async Task<IActionResult> GetCurrent(int funcionarioId)
        {
            var result = await _service.GetCurrentByFuncionarioIdAsync(funcionarioId);
            if (result == null)
                return NotFound("Nenhuma escala ativa para este funcionário.");

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Assign([FromBody] FuncionarioEscalaCreateDto dto)
        {
            try
            {
                var created = await _service.AssignAsync(dto);
                return Ok(created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var removed = await _service.RemoveAsync(id);
            if (!removed)
                return NotFound("Vínculo não encontrado.");

            return NoContent();
        }
    }
}
