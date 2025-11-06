using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FuniproApi.Data;
using FuniproApi.Models;
using FuniproApi.Services;

// FORÇAR AMBIENTE DEVELOPMENT SE NÃO ESTIVER EM PRODUÇÃO NO SERVIDOR
var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
if (string.IsNullOrEmpty(environment) || (!environment.Equals("Production", StringComparison.OrdinalIgnoreCase) && !environment.Equals("Staging", StringComparison.OrdinalIgnoreCase)))
{
    Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Aceita enums como números (padrão do System.Text.Json)
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database - SEMPRE USA SQLITE LOCALMENTE (Data Source=)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine($"Ambiente: {builder.Environment.EnvironmentName}");
Console.WriteLine($"Connection String: {connectionString}");

// FORÇA SQLite se a connection string começar com "Data Source=" OU se estiver em Development
if (builder.Environment.IsDevelopment())
{
    // Em Development, SEMPRE usa SQLite
    connectionString = "Data Source=funipro.db;Foreign Keys=True";
    Console.WriteLine("FORÇANDO SQLite para desenvolvimento local!");
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        options.UseSqlite(connectionString, sqliteOptions =>
        {
            sqliteOptions.CommandTimeout(30);
        });
    });
}
else if (connectionString?.StartsWith("Data Source=") == true)
{
    // Produção pode usar SQLite se a connection string for SQLite
    Console.WriteLine("Usando SQLite como banco de dados");
    if (!connectionString.Contains("Foreign Keys"))
    {
        connectionString += ";Foreign Keys=True";
    }
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        options.UseSqlite(connectionString, sqliteOptions =>
        {
            sqliteOptions.CommandTimeout(30);
        });
    });
}
else
{
    // Produção usando SQL Server
    Console.WriteLine("Usando SQL Server como banco de dados");
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));
}

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = builder.Environment.IsProduction();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", builder =>
    {
        builder.WithOrigins(
                   "http://localhost:3000",
                   "https://funipro.shop",
                   "https://www.funipro.shop",
                   "https://api.funipro.shop"
               )
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDealService, DealService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS redirection apenas em produção
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    
    await DbInitializer.Initialize(context, userManager, roleManager);
}

app.Run();