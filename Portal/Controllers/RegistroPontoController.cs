using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Portal.Services;
using Portal.DTOs;

namespace Portal.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Public")]
    public class RegistroPontoController : ControllerBase
    {
        private readonly IRegistroPontoService _service;

        public RegistroPontoController(IRegistroPontoService service)
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
                return NotFound($"Registro de Ponto não encontrado.");

            return Ok(entity);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RegistroPontoCreateDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] RegistroPontoUpdateDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated)
                return NotFound($"Registro de Ponto não encontrado para atualização.");

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound($"Registro de Ponto não encontrado para exclusão.");

            return NoContent();
        }
    }
}
