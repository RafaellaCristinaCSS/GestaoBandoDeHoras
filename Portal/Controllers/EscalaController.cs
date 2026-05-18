using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Portal.Services;
using Portal.DTOs;

namespace Portal.Controllers
{
    [ApiController]
    [Route("api/escalas")]
    [Authorize(Policy = "Public")]
    public class EscalaController : ControllerBase
    {
        private readonly IEscalaService _service;

        public EscalaController(IEscalaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var entity = await _service.GetByIdAsync(id);
            if (entity == null)
                return NotFound("Escala não encontrada.");

            return Ok(entity);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EscalaCreateDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] EscalaUpdateDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated)
                return NotFound("Escala não encontrada para atualização.");

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound("Escala não encontrada para exclusão.");

            return NoContent();
        }

        // ─── Detalhes ────────────────────────────────────────────────────────────

        [HttpPost("{escalaId}/detalhes")]
        public async Task<IActionResult> AddDetalhe(int escalaId, [FromBody] EscalaDetalheCreateDto dto)
        {
            var created = await _service.AddDetalheAsync(escalaId, dto);
            return Ok(created);
        }

        [HttpPut("detalhes/{detalheId}")]
        public async Task<IActionResult> UpdateDetalhe(int detalheId, [FromBody] EscalaDetalheUpdateDto dto)
        {
            var updated = await _service.UpdateDetalheAsync(detalheId, dto);
            if (!updated)
                return NotFound("Detalhe não encontrado para atualização.");

            return NoContent();
        }

        [HttpDelete("detalhes/{detalheId}")]
        public async Task<IActionResult> DeleteDetalhe(int detalheId)
        {
            var deleted = await _service.DeleteDetalheAsync(detalheId);
            if (!deleted)
                return NotFound("Detalhe não encontrado para exclusão.");

            return NoContent();
        }
    }
}
