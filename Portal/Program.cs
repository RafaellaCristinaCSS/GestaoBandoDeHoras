using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

                // Railway / produção
                if(
                    uri.Host.Contains("railway.app")
                    || uri.Host.Contains("up.railway.app")
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

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
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

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
);

// Repositories
builder.Services.AddScoped<IFuncionarioRepository,FuncionarioRepository>();
builder.Services.AddScoped<IEscalaRepository,EscalaRepository>();
builder.Services.AddScoped<IRegistroPontoRepository,RegistroPontoRepository>();
builder.Services.AddScoped<IFeriasRepository,FeriasRepository>();

// Services
builder.Services.AddScoped<IFuncionarioService,FuncionarioService>();
builder.Services.AddScoped<IEscalaService,EscalaService>();
builder.Services.AddScoped<IRegistroPontoService,RegistroPontoService>();
builder.Services.AddScoped<IFeriasService,FeriasService>();

var app = builder.Build();

// Create Database
using(var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    dbContext.Database.EnsureCreated();
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