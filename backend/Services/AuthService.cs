using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System;
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

            // Atribuir role conforme especificado, ou "User" como padrão
            var roleToAssign = !string.IsNullOrEmpty(registerDto.Role) && 
                               (registerDto.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase) || 
                                registerDto.Role.Equals("User", StringComparison.OrdinalIgnoreCase))
                ? registerDto.Role
                : "User";

            await _userManager.AddToRoleAsync(user, roleToAssign);

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
        Task<IEnumerable<DealDto>> GetArchivedDealsAsync(string userId);
        Task<DealDto> ArchiveDealAsync(int id, string userId);
        Task<DealDto> UnarchiveDealAsync(int id, string userId);
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
                .Where(d => d.UserId == userId && !d.IsArchived)
                .ToListAsync();

            var totalDeals = deals.Count;
            var closedDeals = deals.Count(d => d.Status == DealStatus.Fechado);
            var totalValue = deals.Sum(d => d.Value);
            var closedValue = deals.Where(d => d.Status == DealStatus.Fechado).Sum(d => d.Value);
            
            // Valores brutos e líquidos
            var totalGrossValue = deals.Sum(d => d.GrossValue > 0 ? d.GrossValue : d.Value);
            var totalNetValue = deals.Sum(d => d.NetValue > 0 ? d.NetValue : d.Value);
            var closedGrossValue = deals.Where(d => d.Status == DealStatus.Fechado).Sum(d => d.GrossValue > 0 ? d.GrossValue : d.Value);
            var closedNetValue = deals.Where(d => d.Status == DealStatus.Fechado).Sum(d => d.NetValue > 0 ? d.NetValue : d.Value);

            var dealsByStatus = deals
                .GroupBy(d => d.Status)
                .Select(g => new DealsByStatusDto
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Deals = g.Select(d => MapToDto(d)).ToList()
                })
                .ToList();

            // Calcular receitas mensais
            var monthlyRevenues = deals
                .Where(d => d.Status == DealStatus.Fechado && d.PaymentDate.HasValue)
                .GroupBy(d => new { 
                    Year = d.PaymentDate.Value.Year, 
                    Month = d.PaymentDate.Value.Month 
                })
                .Select(g => new MonthlyRevenueDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy", new System.Globalization.CultureInfo("pt-BR")),
                    GrossValue = g.Sum(d => d.GrossValue > 0 ? d.GrossValue : d.Value),
                    NetValue = g.Sum(d => d.NetValue > 0 ? d.NetValue : d.Value),
                    TotalDiscounts = g.Sum(d => (d.GrossValue > 0 ? d.GrossValue : d.Value) - (d.NetValue > 0 ? d.NetValue : d.Value)),
                    TotalDeals = g.Count(),
                    RevenueByPaymentMethod = g
                        .Where(d => d.PaymentMethod.HasValue)
                        .GroupBy(d => d.PaymentMethod.ToString())
                        .ToDictionary(k => k.Key, v => v.Sum(d => d.NetValue > 0 ? d.NetValue : d.Value))
                })
                .OrderByDescending(m => m.Year).ThenByDescending(m => m.Month)
                .ToList();

            return new DashboardDto
            {
                TotalDeals = totalDeals,
                ClosedDeals = closedDeals,
                TotalValue = totalValue,
                ClosedValue = closedValue,
                TotalGrossValue = totalGrossValue,
                TotalNetValue = totalNetValue,
                ClosedGrossValue = closedGrossValue,
                ClosedNetValue = closedNetValue,
                DealsByStatus = dealsByStatus,
                MonthlyRevenues = monthlyRevenues
            };
        }

        public async Task<IEnumerable<DealDto>> GetDealsAsync(string userId)
        {
            var deals = await _context.Deals
                .Where(d => d.UserId == userId && !d.IsArchived)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            return deals.Select(MapToDto);
        }

        public async Task<IEnumerable<DealDto>> GetArchivedDealsAsync(string userId)
        {
            var deals = await _context.Deals
                .Where(d => d.UserId == userId && d.IsArchived)
                .OrderByDescending(d => d.ArchivedAt ?? d.UpdatedAt)
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
            // Validar se o userId existe no banco
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("UserId não pode ser nulo ou vazio", nameof(userId));
            }

            // Buscar o usuário completo - se não encontrar, buscar por email como fallback
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                // Tentar encontrar usuário admin como fallback
                var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "mathaus@admin");
                if (adminUser != null)
                {
                    Console.WriteLine($"AVISO: Usuário com ID '{userId}' não encontrado. Usando admin fallback: {adminUser.Id}");
                    userId = adminUser.Id;
                    user = adminUser;
                }
                else
                {
                    Console.WriteLine($"ERRO: Usuário com ID '{userId}' não encontrado e não há admin disponível");
                    var allUsers = await _context.Users.Select(u => new { u.Id, u.Email }).ToListAsync();
                    Console.WriteLine($"Usuários disponíveis: {string.Join(", ", allUsers.Select(u => $"{u.Email} ({u.Id})"))}");
                    throw new InvalidOperationException($"Usuário não encontrado. Faça logout e login novamente.");
                }
            }
            
            Console.WriteLine($"Criando Deal para usuário: {user.Email} (ID: {userId})");

            var deal = new Deal
            {
                Title = createDealDto.Title,
                Company = createDealDto.Company,
                ContactName = createDealDto.ContactName,
                Email = createDealDto.Email,
                Phone = createDealDto.Phone,
                Value = createDealDto.Value,
                // GrossValue e NetValue serão calculados automaticamente como o Value inicialmente
                // O valor bruto será preenchido quando o negócio for fechado
                GrossValue = createDealDto.GrossValue.HasValue && createDealDto.GrossValue > 0 ? createDealDto.GrossValue.Value : createDealDto.Value,
                NetValue = createDealDto.NetValue.HasValue && createDealDto.NetValue > 0 ? createDealDto.NetValue.Value : createDealDto.Value,
                Status = createDealDto.Status,
                Priority = createDealDto.Priority,
                PaymentMethod = createDealDto.PaymentMethod,
                ExpectedCloseDate = createDealDto.ExpectedCloseDate,
                PaymentDate = createDealDto.PaymentDate,
                Birthday = createDealDto.Birthday,
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
            
            if (updateDealDto.GrossValue.HasValue)
                deal.GrossValue = updateDealDto.GrossValue.Value;
            
            if (updateDealDto.NetValue.HasValue)
                deal.NetValue = updateDealDto.NetValue.Value;
            
            if (updateDealDto.Status.HasValue)
                deal.Status = updateDealDto.Status.Value;
            
            if (updateDealDto.Priority.HasValue)
                deal.Priority = updateDealDto.Priority.Value;
            
            if (updateDealDto.PaymentMethod.HasValue)
                deal.PaymentMethod = updateDealDto.PaymentMethod.Value;
            
            if (updateDealDto.ExpectedCloseDate.HasValue)
                deal.ExpectedCloseDate = updateDealDto.ExpectedCloseDate.Value;
            
            if (updateDealDto.PaymentDate.HasValue)
                deal.PaymentDate = updateDealDto.PaymentDate.Value;
            
            if (updateDealDto.Birthday.HasValue)
                deal.Birthday = updateDealDto.Birthday.Value;

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
                GrossValue = deal.GrossValue > 0 ? deal.GrossValue : deal.Value,
                NetValue = deal.NetValue > 0 ? deal.NetValue : deal.Value,
                Status = deal.Status,
                Priority = deal.Priority,
                PaymentMethod = deal.PaymentMethod,
                ExpectedCloseDate = deal.ExpectedCloseDate,
                PaymentDate = deal.PaymentDate,
                Birthday = deal.Birthday,
                Notes = deal.Notes,
                IsArchived = deal.IsArchived,
                ArchivedAt = deal.ArchivedAt,
                CreatedAt = deal.CreatedAt,
                UpdatedAt = deal.UpdatedAt
            };
        }

        public async Task<DealDto> ArchiveDealAsync(int id, string userId)
        {
            var deal = await _context.Deals
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

            if (deal == null)
            {
                throw new InvalidOperationException("Negócio não encontrado");
            }

            deal.IsArchived = true;
            deal.ArchivedAt = DateTime.UtcNow;
            deal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(deal);
        }

        public async Task<DealDto> UnarchiveDealAsync(int id, string userId)
        {
            var deal = await _context.Deals
                .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

            if (deal == null)
            {
                throw new InvalidOperationException("Negócio não encontrado");
            }

            deal.IsArchived = false;
            deal.ArchivedAt = null;
            deal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(deal);
        }
    }
}