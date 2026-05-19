using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Portal.Data;
using Portal.Repositories;
using Portal.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Environment Variables
builder.Configuration.AddEnvironmentVariables();

// Add services
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend",policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if(!Uri.TryCreate(origin,UriKind.Absolute,out var uri))
                {
                    return false;
                }

                // localhost
                if(
                    uri.Host.Equals("localhost",StringComparison.OrdinalIgnoreCase)
                    || uri.Host.Equals("127.0.0.1")
                )
                {
                    return true;
                }

                // GitHub Pages (frontend)
                if(
                    uri.Host.Equals("rafaellacristinacss.github.io",StringComparison.OrdinalIgnoreCase)
                )
                {
                    return true;
                }

                // Railway / produção
                if(
                    uri.Host.EndsWith(".railway.app",StringComparison.OrdinalIgnoreCase)
                    || uri.Host.Equals("railway.app",StringComparison.OrdinalIgnoreCase)
                )
                {
                    return true;
                }

                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if(string.IsNullOrWhiteSpace(jwtKey))
{
    if(builder.Environment.IsDevelopment())
    {
        // Chave fallback apenas para desenvolvimento/teste local.
        jwtKey = "dev-local-jwt-key-change-me-1234567890";
    }
    else
    {
        throw new InvalidOperationException("Jwt:Key não configurado. Defina Jwt:Key nas configurações de ambiente/produção.");
    }
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Portal.Local";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Portal.Local";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });

// Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Public",policy =>
    {
        policy.RequireAssertion(_ => true);
    });
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

connectionString ??= BuildPostgresConnectionStringFromDatabaseUrl(
    builder.Configuration["DATABASE_URL"]
);

if(string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection não configurada. Defina ConnectionStrings__DefaultConnection ou DATABASE_URL no ambiente de produção."
    );
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
);

// Repositories
builder.Services.AddScoped<IFuncionarioRepository,FuncionarioRepository>();
builder.Services.AddScoped<ICargoRepository,CargoRepository>();
builder.Services.AddScoped<IEscalaRepository,EscalaRepository>();
builder.Services.AddScoped<IEscalaDetalheRepository,EscalaDetalheRepository>();
builder.Services.AddScoped<IFuncionarioEscalaRepository,FuncionarioEscalaRepository>();
builder.Services.AddScoped<IRegistroPontoRepository,RegistroPontoRepository>();
builder.Services.AddScoped<IFeriasRepository,FeriasRepository>();

// Services
builder.Services.AddScoped<IFuncionarioService,FuncionarioService>();
builder.Services.AddScoped<ICargoService,CargoService>();
builder.Services.AddScoped<IEscalaService,EscalaService>();
builder.Services.AddScoped<IFuncionarioEscalaService,FuncionarioEscalaService>();
builder.Services.AddScoped<IRegistroPontoService,RegistroPontoService>();
builder.Services.AddScoped<IFeriasService,FeriasService>();

var app = builder.Build();

// Create Database
using(var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    dbContext.Database.Migrate();
}

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

// HTTPS
if(!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Middlewares
app.UseCors("Frontend");

app.UseAuthentication();

app.UseAuthorization();

// Controllers
app.MapControllers();

// Root
app.MapGet("/",() => Results.Redirect("/swagger"));

app.Run();

static string? BuildPostgresConnectionStringFromDatabaseUrl(string? databaseUrl)
{
    if(string.IsNullOrWhiteSpace(databaseUrl))
    {
        return null;
    }

    if(!Uri.TryCreate(databaseUrl,UriKind.Absolute,out var uri))
    {
        return null;
    }

    var userInfoParts = uri.UserInfo.Split(':',2,StringSplitOptions.TrimEntries);
    if(userInfoParts.Length != 2)
    {
        return null;
    }

    var databaseName = uri.AbsolutePath.Trim('/');
    if(string.IsNullOrWhiteSpace(databaseName))
    {
        return null;
    }

    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = Uri.UnescapeDataString(userInfoParts[0]),
        Password = Uri.UnescapeDataString(userInfoParts[1]),
        Database = Uri.UnescapeDataString(databaseName),
        SslMode = SslMode.Require,
        TrustServerCertificate = true
    };

    return builder.ConnectionString;
}