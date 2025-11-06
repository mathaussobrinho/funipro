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
        public DbSet<Module> Modules { get; set; }
        public DbSet<UserModule> UserModules { get; set; }

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

            // Module configuration
            builder.Entity<Module>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.Key).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.HasIndex(e => e.Key).IsUnique();
            });

            // UserModule configuration (many-to-many)
            builder.Entity<UserModule>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasOne(um => um.User)
                    .WithMany(u => u.UserModules)
                    .HasForeignKey(um => um.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(um => um.Module)
                    .WithMany(m => m.UserModules)
                    .HasForeignKey(um => um.ModuleId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Evitar duplicatas
                entity.HasIndex(e => new { e.UserId, e.ModuleId }).IsUnique();
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

                // Criar módulos padrão se não existirem
                var modules = new[]
                {
                    new Module { Name = "Funil de Vendas", Description = "Gerenciamento de negócios e vendas", Key = "funnel", IsActive = true },
                    new Module { Name = "Estoque", Description = "Controle de inventário", Key = "inventory", IsActive = true },
                    new Module { Name = "Relatórios", Description = "Relatórios e análises", Key = "reports", IsActive = true },
                    new Module { Name = "Sublocação", Description = "Gestão de sublocação", Key = "sublocation", IsActive = true },
                    new Module { Name = "Arquivados", Description = "Negócios arquivados", Key = "archived", IsActive = true }
                };

                foreach (var module in modules)
                {
                    var existingModule = await context.Modules.FirstOrDefaultAsync(m => m.Key == module.Key);
                    if (existingModule == null)
                    {
                        context.Modules.Add(module);
                        Console.WriteLine($"Módulo '{module.Name}' criado.");
                    }
                }

                await context.SaveChangesAsync();

                // Se for o admin, dar acesso a todos os módulos
                if (adminUser != null)
                {
                    var adminModules = await context.UserModules
                        .Where(um => um.UserId == adminUser.Id)
                        .ToListAsync();

                    if (!adminModules.Any())
                    {
                        var allModules = await context.Modules.Where(m => m.IsActive).ToListAsync();
                        foreach (var module in allModules)
                        {
                            context.UserModules.Add(new UserModule
                            {
                                UserId = adminUser.Id,
                                ModuleId = module.Id
                            });
                        }
                        await context.SaveChangesAsync();
                        Console.WriteLine("Todos os módulos atribuídos ao admin.");
                    }
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