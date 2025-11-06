using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using FuniproApi.Models;

namespace FuniproApi.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Deal> Deals { get; set; }
        public DbSet<Inventory> Inventories { get; set; }
        public DbSet<SubLocation> SubLocations { get; set; }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await base.SaveChangesAsync(cancellationToken);
        }

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
                
                entity.Property(e => e.GrossValue)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                
                entity.Property(e => e.NetValue)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                
                entity.Property(e => e.Status)
                    .HasConversion<int>()
                    .HasDefaultValue(DealStatus.Lead);
                
                entity.Property(e => e.Priority)
                    .HasConversion<int>()
                    .HasDefaultValue(DealPriority.Media);
                
                entity.Property(e => e.PaymentMethod)
                    .HasConversion<int>();
                
                // NOVO CAMPO Notes
                entity.Property(e => e.Notes)
                    .HasMaxLength(2000); // Limite de 2000 caracteres
                
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.IsArchived)
                    .HasDefaultValue(false);

                entity.Property(e => e.ArchivedAt);

                // Foreign key relationship
                entity.HasOne(d => d.User)
                    .WithMany(u => u.Deals)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.PaymentDate);
            });

            // ApplicationUser configuration
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Inventory configuration
            builder.Entity<Inventory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.MinQuantity).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.HasOne(i => i.User).WithMany(u => u.Inventories).HasForeignKey(i => i.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            // SubLocation configuration
            builder.Entity<SubLocation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ServiceValue).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.DiscountPercentage).HasColumnType("decimal(5,2)").HasDefaultValue(0);
                entity.Property(e => e.DiscountValue).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.NetValue).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.HasOne(s => s.User).WithMany(u => u.SubLocations).HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }

    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context, 
            UserManager<ApplicationUser> userManager, 
            RoleManager<IdentityRole> roleManager)
        {
            try
            {
                // Verificar se o banco existe e aplicar migrations
                if (await context.Database.CanConnectAsync())
                {
                    Console.WriteLine("Banco de dados já existe. Aplicando migrations...");
                    await context.Database.MigrateAsync();
                    Console.WriteLine("Migrations aplicadas com sucesso!");
                }
                else
                {
                    Console.WriteLine("Criando banco de dados...");
                    await context.Database.MigrateAsync();
                    Console.WriteLine("Banco de dados criado com sucesso!");
                }

                // Create roles
                string[] roleNames = { "Admin", "User" };
                foreach (var roleName in roleNames)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        await roleManager.CreateAsync(new IdentityRole(roleName));
                        Console.WriteLine($"Role '{roleName}' criada.");
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
                        Console.WriteLine($"Usuário admin criado: {adminEmail}");
                    }
                    else
                    {
                        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                        Console.WriteLine($"ERRO ao criar usuário admin: {errors}");
                    }
                }
                else
                {
                    Console.WriteLine($"Usuário admin já existe: {adminEmail}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERRO ao inicializar banco de dados: {ex.Message}");
                Console.WriteLine($"Tipo do erro: {ex.GetType().Name}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Erro interno: {ex.InnerException.Message}");
                }
                throw; // Re-throw para que a aplicação saiba que houve erro
            }
        }
    }
}