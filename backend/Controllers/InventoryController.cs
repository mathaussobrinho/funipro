using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FuniproApi.Models;
using FuniproApi.Services;
using Microsoft.EntityFrameworkCore;
using FuniproApi.Data;

namespace FuniproApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InventoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("AVISO: ClaimTypes.NameIdentifier não encontrado no token (Inventory)");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetInventories()
        {
            var userId = GetUserId();
            var inventories = await _context.Inventories
                .Where(i => i.UserId == userId)
                .OrderBy(i => i.Name)
                .Select(i => new InventoryDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    MinQuantity = i.MinQuantity,
                    UnitPrice = i.UnitPrice,
                    Category = i.Category,
                    Supplier = i.Supplier,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(inventories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetInventory(int id)
        {
            var userId = GetUserId();
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (inventory == null)
                return NotFound();

            var dto = new InventoryDto
            {
                Id = inventory.Id,
                Name = inventory.Name,
                Description = inventory.Description,
                Quantity = inventory.Quantity,
                MinQuantity = inventory.MinQuantity,
                UnitPrice = inventory.UnitPrice,
                Category = inventory.Category,
                Supplier = inventory.Supplier,
                CreatedAt = inventory.CreatedAt,
                UpdatedAt = inventory.UpdatedAt
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateInventory([FromBody] CreateInventoryDto createDto)
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

                var inventory = new Inventory
                {
                    Name = createDto.Name,
                    Description = createDto.Description,
                    Quantity = createDto.Quantity,
                    MinQuantity = createDto.MinQuantity,
                    UnitPrice = createDto.UnitPrice,
                    Category = createDto.Category,
                    Supplier = createDto.Supplier,
                    UserId = userId
                };

                _context.Inventories.Add(inventory);
                await _context.SaveChangesAsync();

            var dto = new InventoryDto
            {
                Id = inventory.Id,
                Name = inventory.Name,
                Description = inventory.Description,
                Quantity = inventory.Quantity,
                MinQuantity = inventory.MinQuantity,
                UnitPrice = inventory.UnitPrice,
                Category = inventory.Category,
                Supplier = inventory.Supplier,
                CreatedAt = inventory.CreatedAt,
                UpdatedAt = inventory.UpdatedAt
            };

                return CreatedAtAction(nameof(GetInventory), new { id = inventory.Id }, dto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao criar Inventory: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao criar item do estoque", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] CreateInventoryDto updateDto)
        {
            var userId = GetUserId();
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (inventory == null)
                return NotFound();

            inventory.Name = updateDto.Name;
            inventory.Description = updateDto.Description;
            inventory.Quantity = updateDto.Quantity;
            inventory.MinQuantity = updateDto.MinQuantity;
            inventory.UnitPrice = updateDto.UnitPrice;
            inventory.Category = updateDto.Category;
            inventory.Supplier = updateDto.Supplier;
            inventory.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var dto = new InventoryDto
            {
                Id = inventory.Id,
                Name = inventory.Name,
                Description = inventory.Description,
                Quantity = inventory.Quantity,
                MinQuantity = inventory.MinQuantity,
                UnitPrice = inventory.UnitPrice,
                Category = inventory.Category,
                Supplier = inventory.Supplier,
                CreatedAt = inventory.CreatedAt,
                UpdatedAt = inventory.UpdatedAt
            };

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            var userId = GetUserId();
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (inventory == null)
                return NotFound();

            _context.Inventories.Remove(inventory);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/entry")]
        public async Task<IActionResult> AddEntry(int id, [FromBody] InventoryMovementDto movement)
        {
            var userId = GetUserId();
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (inventory == null)
                return NotFound();

            inventory.Quantity += movement.Quantity;
            inventory.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Entrada registrada com sucesso", newQuantity = inventory.Quantity });
        }

        [HttpPost("{id}/exit")]
        public async Task<IActionResult> AddExit(int id, [FromBody] InventoryMovementDto movement)
        {
            var userId = GetUserId();
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (inventory == null)
                return NotFound();

            if (inventory.Quantity < movement.Quantity)
                return BadRequest(new { message = "Quantidade insuficiente em estoque" });

            inventory.Quantity -= movement.Quantity;
            inventory.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Saída registrada com sucesso", newQuantity = inventory.Quantity });
        }
    }

    public class InventoryMovementDto
    {
        public decimal Quantity { get; set; }
        public string? Notes { get; set; }
    }
}

