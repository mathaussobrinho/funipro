using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuniproApi.Models
{
    public class ApplicationUser : IdentityUser
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    }

    public class Deal
    {
        public int Id { get; set; }
        
        [Required]
        public string Title { get; set; }
        
        public string? Company { get; set; }
        
        public string? ContactName { get; set; }
        
        [EmailAddress]
        public string? Email { get; set; }
        
        public string? Phone { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Value { get; set; }
        
        [Required]
        public DealStatus Status { get; set; } = DealStatus.Lead;
        
        public DealPriority Priority { get; set; } = DealPriority.Media;
        
        public DateTime? ExpectedCloseDate { get; set; }
        
        // NOVO CAMPO ADICIONADO
        public string? Notes { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string UserId { get; set; }
        
        public ApplicationUser User { get; set; }
    }

    public enum DealStatus
    {
        Lead = 0,
        Qualificado = 1,
        Proposta = 2,
        Negociacao = 3,
        Fechado = 4
    }

    public enum DealPriority
    {
        Baixa = 0,
        Media = 1,
        Alta = 2
    }

    // DTOs
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string Password { get; set; }
    }

    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; }
    }

    public class DealDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Company { get; set; }
        public string? ContactName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public decimal Value { get; set; }
        public DealStatus Status { get; set; }
        public DealPriority Priority { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public string? Notes { get; set; } // NOVO CAMPO
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateDealDto
    {
        [Required]
        public string Title { get; set; }
        
        public string? Company { get; set; }
        public string? ContactName { get; set; }
        
        [EmailAddress]
        public string? Email { get; set; }
        
        public string? Phone { get; set; }
        public decimal Value { get; set; }
        public DealStatus Status { get; set; } = DealStatus.Lead;
        public DealPriority Priority { get; set; } = DealPriority.Media;
        public DateTime? ExpectedCloseDate { get; set; }
        public string? Notes { get; set; } // NOVO CAMPO
    }

    public class UpdateDealDto
    {
        public string? Title { get; set; }
        public string? Company { get; set; }
        public string? ContactName { get; set; }
        
        [EmailAddress]
        public string? Email { get; set; }
        
        public string? Phone { get; set; }
        public decimal? Value { get; set; }
        public DealStatus? Status { get; set; }
        public DealPriority? Priority { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public string? Notes { get; set; } // NOVO CAMPO
    }

    public class DashboardDto
    {
        public int TotalDeals { get; set; }
        public int ClosedDeals { get; set; }
        public decimal TotalValue { get; set; }
        public decimal ClosedValue { get; set; }
        public List<DealsByStatusDto> DealsByStatus { get; set; } = new();
    }

    public class DealsByStatusDto
    {
        public DealStatus Status { get; set; }
        public int Count { get; set; }
        public List<DealDto> Deals { get; set; } = new();
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string UserId { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
    }

    public class UpdatePasswordDto
    {
        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; }
    }

    public class UpdateStatusDto
    {
        [Required]
        public DealStatus Status { get; set; }
    }
}