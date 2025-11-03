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
            // Garantir foreign keys antes de salvar - SQLite precisa disso toda vez
            var connection = Database.GetDbConnection();
            if (connection is Microsoft.Data.Sqlite.SqliteConnection sqliteConnection)
            {
                var wasOpen = sqliteConnection.State == System.Data.ConnectionState.Open;
                if (!wasOpen)
                {
                    await sqliteConnection.OpenAsync(cancellationToken);
                }
                
                try
                {
                    using var command = sqliteConnection.CreateCommand();
                    command.CommandText = "PRAGMA foreign_keys = ON;";
                    await command.ExecuteNonQueryAsync(cancellationToken);
                }
                finally
                {
                    // Não fechar se já estava aberta
                }
            }
            
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
                    .HasDefaultValueSql("datetime('now')");
                
                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("datetime('now')");

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
                    .HasDefaultValueSql("datetime('now')");
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
                // Habilitar foreign keys no SQLite
                try
                {
                    var conn = context.Database.GetDbConnection();
                    if (conn is Microsoft.Data.Sqlite.SqliteConnection sqliteConnection)
                    {
                        await sqliteConnection.OpenAsync();
                        using var pragmaCommand = sqliteConnection.CreateCommand();
                        pragmaCommand.CommandText = "PRAGMA foreign_keys = ON;";
                        await pragmaCommand.ExecuteNonQueryAsync();
                    }
                }
                catch { }

                // Verificar se precisa recriar o banco (se faltam colunas novas)
                bool needsRecreate = false;
                if (await context.Database.CanConnectAsync())
                {
                       try
                       {
                           // Verificar se as colunas novas existem na tabela Deals
                           var conn = context.Database.GetDbConnection();
                           await conn.OpenAsync();
                           using var command = conn.CreateCommand();
                           command.CommandText = @"
                               SELECT COUNT(*) FROM pragma_table_info('Deals') 
                               WHERE name IN ('Birthday', 'IsArchived', 'ArchivedAt')";
                           var result = await command.ExecuteScalarAsync();
                           var columnCount = Convert.ToInt64(result);
                           
                           // Verificar se todas as 3 colunas existem
                           if (columnCount < 3)
                           {
                               Console.WriteLine("Banco existe mas faltam colunas novas (Birthday, IsArchived, ArchivedAt). Recriando...");
                               needsRecreate = true;
                           }
                           else
                           {
                               Console.WriteLine("Banco de dados já existe e tem todas as colunas.");
                           }
                           await conn.CloseAsync();
                       }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erro ao verificar colunas: {ex.Message}. Recriando banco...");
                        needsRecreate = true;
                    }
                }
                else
                {
                    needsRecreate = true;
                }

                if (needsRecreate)
                {
                    Console.WriteLine("Criando/recriando banco de dados...");
                    try
                    {
                        await context.Database.EnsureDeletedAsync();
                    }
                    catch { }
                    
                    await context.Database.EnsureCreatedAsync();
                    Console.WriteLine("Banco de dados criado com sucesso!");
                }
                
                // SEMPRE habilitar foreign keys após qualquer operação
                try
                {
                    var conn = context.Database.GetDbConnection();
                    if (conn is Microsoft.Data.Sqlite.SqliteConnection sqliteConnection)
                    {
                        var wasOpen = conn.State == System.Data.ConnectionState.Open;
                        if (!wasOpen)
                        {
                            await conn.OpenAsync();
                        }
                        using var pragmaCommand = sqliteConnection.CreateCommand();
                        pragmaCommand.CommandText = "PRAGMA foreign_keys = ON;";
                        await pragmaCommand.ExecuteNonQueryAsync();
                        if (!wasOpen)
                        {
                            await conn.CloseAsync();
                        }
                        Console.WriteLine("Foreign keys habilitadas no SQLite");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Erro ao habilitar foreign keys: {ex.Message}");
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