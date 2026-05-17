using Microsoft.EntityFrameworkCore;
using Portal.Models;

namespace Portal.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Funcionario> Funcionario { get; set; } = default!;
        public DbSet<Escala> Escala { get; set; } = default!;
        public DbSet<RegistroPonto> RegistroPonto { get; set; } = default!;
        public DbSet<Ferias> Ferias { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Funcionario>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<Escala>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<RegistroPonto>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<Ferias>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

        }
    }
}
