using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Portal.Data;
using Portal.Repositories;
using Portal.Services;
using System.Data;
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

    await BaselineLegacyDatabaseAsync(dbContext, app.Logger, app.Lifetime.ApplicationStopping);
    await dbContext.Database.MigrateAsync(app.Lifetime.ApplicationStopping);
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

static async Task BaselineLegacyDatabaseAsync(
    AppDbContext dbContext,
    ILogger logger,
    CancellationToken cancellationToken)
{
    var allMigrations = dbContext.Database.GetMigrations();
    var initialMigrationId = allMigrations.FirstOrDefault();
    if(string.IsNullOrWhiteSpace(initialMigrationId))
    {
        return;
    }

    var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync(cancellationToken);
    if(appliedMigrations.Any())
    {
        return;
    }

    if(!await LegacyInitialSchemaExistsAsync(dbContext, cancellationToken))
    {
        return;
    }

    await using var connection = dbContext.Database.GetDbConnection();
    var shouldCloseConnection = connection.State != ConnectionState.Open;
    if(shouldCloseConnection)
    {
        await connection.OpenAsync(cancellationToken);
    }

    try
    {
        await using var command = connection.CreateCommand();
        command.CommandText = @"
CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
    ""MigrationId"" character varying(150) NOT NULL,
    ""ProductVersion"" character varying(32) NOT NULL,
    CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
);

INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
SELECT @migrationId, @productVersion
WHERE NOT EXISTS (
    SELECT 1
    FROM ""__EFMigrationsHistory""
    WHERE ""MigrationId"" = @migrationId
);";

        var migrationParameter = command.CreateParameter();
        migrationParameter.ParameterName = "@migrationId";
        migrationParameter.Value = initialMigrationId;
        command.Parameters.Add(migrationParameter);

        var productVersionParameter = command.CreateParameter();
        productVersionParameter.ParameterName = "@productVersion";
        productVersionParameter.Value = typeof(DbContext).Assembly.GetName().Version?.ToString(3) ?? "8.0.0";
        command.Parameters.Add(productVersionParameter);

        await command.ExecuteNonQueryAsync(cancellationToken);

        logger.LogWarning(
            "Banco legado detectado sem __EFMigrationsHistory. Migration inicial {MigrationId} foi registrada antes de aplicar as demais.",
            initialMigrationId);
    }
    finally
    {
        if(shouldCloseConnection)
        {
            await connection.CloseAsync();
        }
    }
}

static async Task<bool> LegacyInitialSchemaExistsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
{
    const string sql = @"
SELECT
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Funcionario')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Escala')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Ferias')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'RegistroPonto');";

    await using var connection = dbContext.Database.GetDbConnection();
    var shouldCloseConnection = connection.State != ConnectionState.Open;
    if(shouldCloseConnection)
    {
        await connection.OpenAsync(cancellationToken);
    }

    try
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is bool exists && exists;
    }
    finally
    {
        if(shouldCloseConnection)
        {
            await connection.CloseAsync();
        }
    }
}