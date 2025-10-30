using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FuniproApi.Models;
using FuniproApi.Services;

namespace FuniproApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DealsController : ControllerBase
    {
        private readonly IDealService _dealService;

        public DealsController(IDealService dealService)
        {
            _dealService = dealService;
        }

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var userId = GetUserId();
            var dashboard = await _dealService.GetDashboardAsync(userId);
            return Ok(dashboard);
        }

        [HttpGet]
        public async Task<IActionResult> GetDeals()
        {
            var userId = GetUserId();
            var deals = await _dealService.GetDealsAsync(userId);
            return Ok(deals);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeal(int id)
        {
            var userId = GetUserId();
            var deal = await _dealService.GetDealByIdAsync(id, userId);
            
            if (deal == null)
            {
                return NotFound(new { message = "Negócio não encontrado" });
            }

            return Ok(deal);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDeal([FromBody] CreateDealDto createDealDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetUserId();
            var deal = await _dealService.CreateDealAsync(createDealDto, userId);
            
            return CreatedAtAction(nameof(GetDeal), new { id = deal.Id }, deal);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDeal(int id, [FromBody] UpdateDealDto updateDealDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetUserId();
            var deal = await _dealService.UpdateDealAsync(id, updateDealDto, userId);
            
            if (deal == null)
            {
                return NotFound(new { message = "Negócio não encontrado" });
            }

            return Ok(deal);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateDealStatus(int id, [FromBody] UpdateStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetUserId();
            var deal = await _dealService.UpdateDealStatusAsync(id, statusDto.Status, userId);
            
            if (deal == null)
            {
                return NotFound(new { message = "Negócio não encontrado" });
            }

            return Ok(deal);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeal(int id)
        {
            var userId = GetUserId();
            var result = await _dealService.DeleteDealAsync(id, userId);
            
            if (!result)
            {
                return NotFound(new { message = "Negócio não encontrado" });
            }

            return Ok(new { message = "Negócio deletado com sucesso" });
        }
    }
}