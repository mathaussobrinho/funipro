using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FuniproApi.Data;
using FuniproApi.Models;

namespace FuniproApi.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<IEnumerable<ApplicationUser>> GetAllUsersAsync();
        Task<bool> DeleteUserAsync(string userId);
        Task<bool> UpdateUserPasswordAsync(string userId, string newPassword);
    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                return null;
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                Role = roles.FirstOrDefault() ?? "User"
            };
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
            if (existingUser != null)
            {
                return null; // User already exists
            }

            var user = new ApplicationUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                return null;
            }

            await _userManager.AddToRoleAsync(user, "User");

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                Role = roles.FirstOrDefault() ?? "User"
            };
        }

        public async Task<IEnumerable<ApplicationUser>> GetAllUsersAsync()
        {
            return await _userManager.Users.OrderBy(u => u.Email).ToListAsync();
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            var result = await _userManager.DeleteAsync(user);
            return result.Succeeded;
        }

        public async Task<bool> UpdateUserPasswordAsync(string userId, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            return result.Succeeded;
        }

        private string GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:Secret"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, roles.FirstOrDefault() ?? "User")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), 
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }

    public interface IDealService
    {
        Task<DashboardDto> GetDashboardAsync(string userId);
        Task<IEnumerable<DealDto>> GetDealsAsync(string userId);
        Task<DealDto> GetDealByIdAsync(int id, string userId);
        Task<DealDto> CreateDealAsync(CreateDealDto createDealDto, string userId);
        Task<DealDto> UpdateDealAsync(int id, UpdateDealDto updateDealDto, string userId);
        Task<bool> DeleteDealAsync(int id, string userId);
        Task<DealDto> UpdateDealStatusAsync(int id, DealStatus status, string userId);
    }

    public class DealService : IDealService
    {
        private readonly ApplicationDbContext _context;

        public DealService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardDto> GetDashboardAsync(string userId)
        {
            var deals = await _context.Deals
                .Where(d => d.UserId == userId)
                .ToListAsync();

            var totalDeals = deals.Count;
            var closedDeals = deals.Count(d => d.Status == DealStatus.Fechado);
            var totalValue = deals.Sum(d => d.Value);
            var closedValue = deals.Where(d => d.Status == DealStatus.Fechado).Sum(d => d.Value);

            var dealsByStatus = deals
                .GroupBy(d => d.Status)
                .Select(g => new DealsByStatusDto
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Deals = g.Select(d => MapToDto(d)).ToList()
                })
                .ToList();

            return new DashboardDto
            {
                TotalDeals = totalDeals,
                ClosedDeals = closedDeals,
                TotalValue = totalValue,
                ClosedValue = closedValue,
                DealsByStatus = dealsByStatus
            };
        }

        public async Task<IEnumerable<DealDto>> GetDealsAsync(string userId)
        {
            var deals = await _context.Deals
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            return deals.Select(MapToDto);
        }

        public async Task<DealDto> GetDealByIdAsync(int id, string userId)
        {
            var deal = await _context.Deals
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

            return deal != null ? MapToDto(deal) : null;
        }

        public async Task<DealDto> CreateDealAsync(CreateDealDto createDealDto, string userId)
        {
            var deal = new Deal
            {
                Title = createDealDto.Title,
                Company = createDealDto.Company,
                ContactName = createDealDto.ContactName,
                Email = createDealDto.Email,
                Phone = createDealDto.Phone,
                Value = createDealDto.Value,
                Status = createDealDto.Status,
                Priority = createDealDto.Priority,
                ExpectedCloseDate = createDealDto.ExpectedCloseDate,
                Notes = createDealDto.Notes,
                UserId = userId
            };

            _context.Deals.Add(deal);
            await _context.SaveChangesAsync();

            return MapToDto(deal);
        }

        public async Task<DealDto> UpdateDealAsync(int id, UpdateDealDto updateDealDto, string userId)
        {
            var deal = await _context.Deals
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

            if (deal == null) return null;

            if (!string.IsNullOrEmpty(updateDealDto.Title))
                deal.Title = updateDealDto.Title;
            
            if (updateDealDto.Company != null)
                deal.Company = updateDealDto.Company;
            
            if (updateDealDto.ContactName != null)
                deal.ContactName = updateDealDto.ContactName;
            
            if (updateDealDto.Email != null)
                deal.Email = updateDealDto.Email;
            
            if (updateDealDto.Phone != null)
                deal.Phone = updateDealDto.Phone;
            
            if (updateDealDto.Value.HasValue)
                deal.Value = updateDealDto.Value.Value;
            
            if (updateDealDto.Status.HasValue)
                deal.Status = updateDealDto.Status.Value;
            
            if (updateDealDto.Priority.HasValue)
                deal.Priority = updateDealDto.Priority.Value;
            
            if (updateDealDto.ExpectedCloseDate.HasValue)
                deal.ExpectedCloseDate = updateDealDto.ExpectedCloseDate.Value;

            if (updateDealDto.Notes != null)
                deal.Notes = updateDealDto.Notes;

            deal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(deal);
        }

        public async Task<bool> DeleteDealAsync(int id, string userId)
        {
            var deal = await _context.Deals
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

            if (deal == null) return false;

            _context.Deals.Remove(deal);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DealDto> UpdateDealStatusAsync(int id, DealStatus status, string userId)
        {
            var deal = await _context.Deals
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

            if (deal == null) return null;

            deal.Status = status;
            deal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(deal);
        }

        private static DealDto MapToDto(Deal deal)
        {
            return new DealDto
            {
                Id = deal.Id,
                Title = deal.Title,
                Company = deal.Company,
                ContactName = deal.ContactName,
                Email = deal.Email,
                Phone = deal.Phone,
                Value = deal.Value,
                Status = deal.Status,
                Priority = deal.Priority,
                ExpectedCloseDate = deal.ExpectedCloseDate,
                Notes = deal.Notes,
                CreatedAt = deal.CreatedAt,
                UpdatedAt = deal.UpdatedAt
            };
        }
    }
}