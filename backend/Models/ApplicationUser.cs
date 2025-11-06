using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuniproApi.Models
{
    public class ApplicationUser : IdentityUser
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<Deal> Deals { get; set; } = new List<Deal>();
        public ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();
        public ICollection<SubLocation> SubLocations { get; set; } = new List<SubLocation>();
        public ICollection<UserModule> UserModules { get; set; } = new List<UserModule>();
    }

    // Modelo de Módulo
    public class Module
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        
        [MaxLength(255)]
        public string? Description { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Key { get; set; } // Chave única do módulo (ex: "funnel", "inventory", "reports", "sublocation", "archived")
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public ICollection<UserModule> UserModules { get; set; } = new List<UserModule>();
    }

    // Relação muitos-para-muitos entre Usuário e Módulo
    public class UserModule
    {
        public int Id { get; set; }
        
        [Required]
        public string UserId { get; set; }
        
        public ApplicationUser User { get; set; }
        
        [Required]
        public int ModuleId { get; set; }
        
        public Module Module { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossValue { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetValue { get; set; }
        
        [Required]
        public DealStatus Status { get; set; } = DealStatus.Lead;
        
        public DealPriority Priority { get; set; } = DealPriority.Media;
        
        public PaymentMethod? PaymentMethod { get; set; }
        
        public DateTime? ExpectedCloseDate { get; set; }
        
        public DateTime? PaymentDate { get; set; }
        
        public DateTime? Birthday { get; set; }
        
        public string? Notes { get; set; }
        
        public bool IsArchived { get; set; } = false;
        
        public DateTime? ArchivedAt { get; set; }
        
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

    public enum PaymentMethod
    {
        Cartao = 0,
        Pix = 1,
        Boleto = 2,
        Dinheiro = 3
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
        
        public string? Role { get; set; }
        
        public List<int>? ModuleIds { get; set; } // IDs dos módulos que o usuário terá acesso
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
        public decimal GrossValue { get; set; }
        public decimal NetValue { get; set; }
        public DealStatus Status { get; set; }
        public DealPriority Priority { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Notes { get; set; }
        public bool IsArchived { get; set; }
        public DateTime? ArchivedAt { get; set; }
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
        public decimal? GrossValue { get; set; }
        public decimal? NetValue { get; set; }
        public DealStatus Status { get; set; } = DealStatus.Lead;
        public DealPriority Priority { get; set; } = DealPriority.Media;
        public PaymentMethod? PaymentMethod { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Notes { get; set; }
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
        public decimal? GrossValue { get; set; }
        public decimal? NetValue { get; set; }
        public DealStatus? Status { get; set; }
        public DealPriority? Priority { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Notes { get; set; }
    }

    public class DashboardDto
    {
        public int TotalDeals { get; set; }
        public int ClosedDeals { get; set; }
        public decimal TotalValue { get; set; }
        public decimal ClosedValue { get; set; }
        public decimal TotalGrossValue { get; set; }
        public decimal TotalNetValue { get; set; }
        public decimal ClosedGrossValue { get; set; }
        public decimal ClosedNetValue { get; set; }
        public List<DealsByStatusDto> DealsByStatus { get; set; } = new();
        public List<MonthlyRevenueDto> MonthlyRevenues { get; set; } = new();
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
        public List<ModuleDto> Modules { get; set; } = new List<ModuleDto>();
    }

    public class ModuleDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string Key { get; set; }
    }

    public class UpdateUserModulesDto
    {
        public List<int> ModuleIds { get; set; } = new List<int>();
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

    // Modelo de Estoque
    public class Inventory
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        public string? Description { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal MinQuantity { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
        
        public string? Category { get; set; }
        
        public string? Supplier { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string UserId { get; set; }
        
        public ApplicationUser User { get; set; }
    }

    // Modelo de Sublocação
    public class SubLocation
    {
        public int Id { get; set; }
        
        [Required]
        public string Title { get; set; }
        
        public string? Description { get; set; }
        
        public string? ThirdPartyName { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceValue { get; set; }
        
        [Column(TypeName = "decimal(5,2)")]
        public decimal DiscountPercentage { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountValue { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetValue { get; set; }
        
        public string? ServiceType { get; set; }
        
        public DateTime ServiceDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string UserId { get; set; }
        
        public ApplicationUser User { get; set; }
    }

    // DTOs para Estoque
    public class InventoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal MinQuantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Category { get; set; }
        public string? Supplier { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateInventoryDto
    {
        [Required]
        public string Name { get; set; }
        
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal MinQuantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Category { get; set; }
        public string? Supplier { get; set; }
    }

    // DTOs para Sublocação
    public class SubLocationDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? ThirdPartyName { get; set; }
        public decimal ServiceValue { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal NetValue { get; set; }
        public string? ServiceType { get; set; }
        public DateTime ServiceDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateSubLocationDto
    {
        [Required]
        public string Title { get; set; }
        
        public string? Description { get; set; }
        public string? ThirdPartyName { get; set; }
        public decimal ServiceValue { get; set; }
        public decimal DiscountPercentage { get; set; }
        public string? ServiceType { get; set; }
        public DateTime ServiceDate { get; set; }
    }

    // DTO para Relatórios
    public class MonthlyRevenueDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; }
        public decimal GrossValue { get; set; }
        public decimal NetValue { get; set; }
        public decimal TotalDiscounts { get; set; }
        public int TotalDeals { get; set; }
        public Dictionary<string, decimal> RevenueByPaymentMethod { get; set; } = new();
    }
}