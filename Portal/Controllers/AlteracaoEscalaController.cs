using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Portal.DTOs;
using Portal.Services;

namespace Portal.Controllers
{
    [ApiController]
    [Route("api/alteracao-escala")]
    [Authorize(Policy = "Public")]
    public class AlteracaoEscalaController : ControllerBase
    {
        private readonly IAlteracaoEscalaService _service;

        public AlteracaoEscalaController(IAlteracaoEscalaService service)
        {
            _service = service;
        }

        [HttpPost("simular")]
        public async Task<IActionResult> Simular([FromBody] SimularAlteracaoEscalaDto dto)
        {
            try
            {
                var result = await _service.SimularAsync(dto);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("confirmar")]
        public async Task<IActionResult> Confirmar([FromBody] ConfirmarAlteracaoEscalaDto dto)
        {
            try
            {
                var result = await _service.ConfirmarAsync(dto);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
