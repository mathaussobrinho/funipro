using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FuniproApi.Data;
using FuniproApi.Models;

namespace FuniproApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ModuleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ModuleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllModules()
        {
            var modules = await _context.Modules
                .Where(m => m.IsActive)
                .OrderBy(m => m.Name)
                .Select(m => new ModuleDto
                {
                    Id = m.Id,
                    Name = m.Name,
                    Description = m.Description,
                    Key = m.Key
                })
                .ToListAsync();

            return Ok(modules);
        }

        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserModules(string userId)
        {
            var userModules = await _context.UserModules
                .Where(um => um.UserId == userId)
                .Include(um => um.Module)
                .Select(um => new ModuleDto
                {
                    Id = um.Module.Id,
                    Name = um.Module.Name,
                    Description = um.Module.Description,
                    Key = um.Module.Key
                })
                .ToListAsync();

            return Ok(userModules);
        }

        [HttpPut("user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserModules(string userId, [FromBody] UpdateUserModulesDto dto)
        {
            // Remover módulos existentes
            var existingUserModules = await _context.UserModules
                .Where(um => um.UserId == userId)
                .ToListAsync();

            _context.UserModules.RemoveRange(existingUserModules);

            // Adicionar novos módulos
            if (dto.ModuleIds != null && dto.ModuleIds.Any())
            {
                var modules = await _context.Modules
                    .Where(m => dto.ModuleIds.Contains(m.Id) && m.IsActive)
                    .ToListAsync();

                var newUserModules = modules.Select(m => new UserModule
                {
                    UserId = userId,
                    ModuleId = m.Id
                }).ToList();

                _context.UserModules.AddRange(newUserModules);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Módulos atualizados com sucesso" });
        }
    }
}

