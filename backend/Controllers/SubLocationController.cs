using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FuniproApi.Models;
using FuniproApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FuniproApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubLocationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubLocationController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("AVISO: ClaimTypes.NameIdentifier não encontrado no token (SubLocation)");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetSubLocations()
        {
            var userId = GetUserId();
            var subLocations = await _context.SubLocations
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.ServiceDate)
                .Select(s => new SubLocationDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Description = s.Description,
                    ThirdPartyName = s.ThirdPartyName,
                    ServiceValue = s.ServiceValue,
                    DiscountPercentage = s.DiscountPercentage,
                    DiscountValue = s.DiscountValue,
                    NetValue = s.NetValue,
                    ServiceType = s.ServiceType,
                    ServiceDate = s.ServiceDate,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                })
                .ToListAsync();

            return Ok(subLocations);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSubLocation(int id)
        {
            var userId = GetUserId();
            var subLocation = await _context.SubLocations
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (subLocation == null)
                return NotFound();

            var dto = new SubLocationDto
            {
                Id = subLocation.Id,
                Title = subLocation.Title,
                Description = subLocation.Description,
                ThirdPartyName = subLocation.ThirdPartyName,
                ServiceValue = subLocation.ServiceValue,
                DiscountPercentage = subLocation.DiscountPercentage,
                DiscountValue = subLocation.DiscountValue,
                NetValue = subLocation.NetValue,
                ServiceType = subLocation.ServiceType,
                ServiceDate = subLocation.ServiceDate,
                CreatedAt = subLocation.CreatedAt,
                UpdatedAt = subLocation.UpdatedAt
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSubLocation([FromBody] CreateSubLocationDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Dados inválidos", errors = ModelState });

            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Usuário não autenticado ou token inválido" });
            }

            try
            {
                // Validar e buscar usuário (com fallback para admin)
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "mathaus@admin");
                    if (adminUser != null)
                    {
                        userId = adminUser.Id;
                        user = adminUser;
                    }
                    else
                    {
                        throw new InvalidOperationException("Usuário não encontrado. Faça logout e login novamente.");
                    }
                }
                
                // Calcular valores de desconto
                var discountValue = createDto.ServiceValue * (createDto.DiscountPercentage / 100);
                var netValue = createDto.ServiceValue - discountValue;

                var subLocation = new SubLocation
                {
                    Title = createDto.Title,
                    Description = createDto.Description,
                    ThirdPartyName = createDto.ThirdPartyName,
                    ServiceValue = createDto.ServiceValue,
                    DiscountPercentage = createDto.DiscountPercentage,
                    DiscountValue = discountValue,
                    NetValue = netValue,
                    ServiceType = createDto.ServiceType,
                    ServiceDate = createDto.ServiceDate,
                    UserId = userId
                };

                _context.SubLocations.Add(subLocation);
                await _context.SaveChangesAsync();

            var dto = new SubLocationDto
            {
                Id = subLocation.Id,
                Title = subLocation.Title,
                Description = subLocation.Description,
                ThirdPartyName = subLocation.ThirdPartyName,
                ServiceValue = subLocation.ServiceValue,
                DiscountPercentage = subLocation.DiscountPercentage,
                DiscountValue = subLocation.DiscountValue,
                NetValue = subLocation.NetValue,
                ServiceType = subLocation.ServiceType,
                ServiceDate = subLocation.ServiceDate,
                CreatedAt = subLocation.CreatedAt,
                UpdatedAt = subLocation.UpdatedAt
            };

                return CreatedAtAction(nameof(GetSubLocation), new { id = subLocation.Id }, dto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao criar SubLocation: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao criar sublocação", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubLocation(int id, [FromBody] CreateSubLocationDto updateDto)
        {
            var userId = GetUserId();
            var subLocation = await _context.SubLocations
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (subLocation == null)
                return NotFound();

            // Recalcular valores
            var discountValue = updateDto.ServiceValue * (updateDto.DiscountPercentage / 100);
            var netValue = updateDto.ServiceValue - discountValue;

            subLocation.Title = updateDto.Title;
            subLocation.Description = updateDto.Description;
            subLocation.ThirdPartyName = updateDto.ThirdPartyName;
            subLocation.ServiceValue = updateDto.ServiceValue;
            subLocation.DiscountPercentage = updateDto.DiscountPercentage;
            subLocation.DiscountValue = discountValue;
            subLocation.NetValue = netValue;
            subLocation.ServiceType = updateDto.ServiceType;
            subLocation.ServiceDate = updateDto.ServiceDate;
            subLocation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var dto = new SubLocationDto
            {
                Id = subLocation.Id,
                Title = subLocation.Title,
                Description = subLocation.Description,
                ThirdPartyName = subLocation.ThirdPartyName,
                ServiceValue = subLocation.ServiceValue,
                DiscountPercentage = subLocation.DiscountPercentage,
                DiscountValue = subLocation.DiscountValue,
                NetValue = subLocation.NetValue,
                ServiceType = subLocation.ServiceType,
                ServiceDate = subLocation.ServiceDate,
                CreatedAt = subLocation.CreatedAt,
                UpdatedAt = subLocation.UpdatedAt
            };

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubLocation(int id)
        {
            var userId = GetUserId();
            var subLocation = await _context.SubLocations
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (subLocation == null)
                return NotFound();

            _context.SubLocations.Remove(subLocation);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

