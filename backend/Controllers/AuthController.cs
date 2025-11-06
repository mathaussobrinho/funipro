using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FuniproApi.Models;
using FuniproApi.Services;

namespace FuniproApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.LoginAsync(loginDto);
            if (result == null)
            {
                return Unauthorized(new { message = "Email ou senha inválidos" });
            }

            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterAsync(registerDto);
            if (result == null)
            {
                return BadRequest(new { message = "Usuário já existe ou erro na criação" });
            }

            return Ok(result);
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
            
            var userList = new List<object>();
            foreach (var u in users)
            {
                var roles = await userManager.GetRolesAsync(u);
                userList.Add(new
                {
                    u.Id,
                    u.Email,
                    u.CreatedAt,
                    Role = roles.FirstOrDefault() ?? "User"
                });
            }

            return Ok(userList);
        }

        [HttpDelete("users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var result = await _authService.DeleteUserAsync(userId);
            if (!result)
            {
                return NotFound(new { message = "Usuário não encontrado" });
            }

            return Ok(new { message = "Usuário deletado com sucesso" });
        }

        [HttpPut("users/{userId}/password")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserPassword(string userId, [FromBody] UpdatePasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.UpdateUserPasswordAsync(userId, dto.NewPassword);
            if (!result)
            {
                return BadRequest(new { message = "Erro ao alterar senha" });
            }

            return Ok(new { message = "Senha alterada com sucesso" });
        }

        [HttpPost("admin/register")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminRegisterUser([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterAsync(registerDto);
            if (result == null)
            {
                return BadRequest(new { message = "Usuário já existe ou erro na criação" });
            }

            return Ok(new { message = "Usuário criado com sucesso", user = result });
        }
    }
}