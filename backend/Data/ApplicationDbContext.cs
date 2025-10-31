using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using FuniproApi.Models;

namespace FuniproApi.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Deal> Deals { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Deal configuration
            builder.Entity<Deal>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(255);
                
                entity.Property(e => e.Company)
                    .HasMaxLength(255);
                
                entity.Property(e => e.ContactName)
                    .HasMaxLength(255);
                
                entity.Property(e => e.Email)
                    .HasMaxLength(255);
                
                entity.Property(e => e.Phone)
                    .HasMaxLength(50);
                
                entity.Property(e => e.Value)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                
                entity.Property(e => e.Status)
                    .HasConversion<int>()
                    .HasDefaultValue(DealStatus.Lead);
                
                entity.Property(e => e.Priority)
                    .HasConversion<int>()
                    .HasDefaultValue(DealPriority.Media);
                
                // NOVO CAMPO Notes
                entity.Property(e => e.Notes)
                    .HasMaxLength(2000); // Limite de 2000 caracteres
                
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");
                
                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                // Foreign key relationship
                entity.HasOne(d => d.User)
                    .WithMany(u => u.Deals)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedAt);
            });

            // ApplicationUser configuration
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");
            });
        }
    }

    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context, 
            UserManager<ApplicationUser> userManager, 
            RoleManager<IdentityRole> roleManager)
        {
            context.Database.EnsureCreated();

            // Create roles
            string[] roleNames = { "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // Create default admin user
            var adminEmail = "mathaus@admin";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, "mathaus@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // Create sample deals for demo (optional)
            if (!context.Deals.Any() && adminUser != null)
            {
                var sampleDeals = new List<Deal>
                {
                    new Deal
                    {
                        Title = "Consultoria Digital",
                        Company = "TechCorp Ltda",
                        ContactName = "Maria Santos",
                        Email = "maria@techcorp.com",
                        Phone = "(11) 99999-9999",
                        Value = 75000.00m,
                        Status = DealStatus.Lead,
                        Priority = DealPriority.Media,
                        ExpectedCloseDate = DateTime.Now.AddDays(30),
                        Notes = "Cliente interessado em transformação digital. Primeira reunião agendada para próxima semana.",
                        UserId = adminUser.Id
                    },
                    new Deal
                    {
                        Title = "App Mobile",
                        Company = "StartupXYZ",
                        ContactName = "Ana Oliveira",
                        Email = "ana@startupxyz.com",
                        Phone = "(11) 88888-8888",
                        Value = 50000.00m,
                        Status = DealStatus.Qualificado,
                        Priority = DealPriority.Baixa,
                        ExpectedCloseDate = DateTime.Now.AddDays(45),
                        Notes = "Startup em fase inicial, orçamento limitado. Negociar prazo de pagamento.",
                        UserId = adminUser.Id
                    },
                    new Deal
                    {
                        Title = "Sistema ERP Completo",
                        Company = "TechCorp Ltda",
                        ContactName = "João Silva",
                        Email = "joao@techcorp.com",
                        Phone = "(11) 77777-7777",
                        Value = 150000.00m,
                        Status = DealStatus.Proposta,
                        Priority = DealPriority.Alta,
                        ExpectedCloseDate = DateTime.Now.AddDays(60),
                        Notes = "Proposta enviada ontem. Cliente solicitou algumas modificações no escopo. Reunião de follow-up na sexta.",
                        UserId = adminUser.Id
                    },
                    new Deal
                    {
                        Title = "Plataforma E-Commerce",
                        Company = "VendaMais",
                        ContactName = "Pedro Costa",
                        Email = "pedro@vendamais.com",
                        Phone = "(11) 66666-6666",
                        Value = 200000.00m,
                        Status = DealStatus.Negociacao,
                        Priority = DealPriority.Alta,
                        ExpectedCloseDate = DateTime.Now.AddDays(15),
                        Notes = "Em fase final de negociação. Cliente quer desconto de 10%. Aguardando aprovação da diretoria.",
                        UserId = adminUser.Id
                    },
                    new Deal
                    {
                        Title = "Sistema CRM",
                        Company = "Gestão Pro",
                        ContactName = "Carlos Lima",
                        Email = "carlos@gestaopro.com",
                        Phone = "(11) 55555-5555",
                        Value = 120000.00m,
                        Status = DealStatus.Fechado,
                        Priority = DealPriority.Alta,
                        ExpectedCloseDate = DateTime.Now.AddDays(-10),
                        Notes = "Projeto finalizado com sucesso! Cliente muito satisfeito. Possível indicação para novos projetos.",
                        UserId = adminUser.Id
                    }
                };

                context.Deals.AddRange(sampleDeals);
                await context.SaveChangesAsync();
            }
        }
    }
}