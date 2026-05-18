using Microsoft.EntityFrameworkCore;
using Portal.Models;

namespace Portal.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Funcionario> Funcionario { get; set; } = default!;
        public DbSet<Cargo> Cargo { get; set; } = default!;
        public DbSet<Escala> Escala { get; set; } = default!;
        public DbSet<EscalaDetalhe> EscalaDetalhe { get; set; } = default!;
        public DbSet<FuncionarioEscala> FuncionarioEscala { get; set; } = default!;
        public DbSet<RegistroPonto> RegistroPonto { get; set; } = default!;
        public DbSet<Ferias> Ferias { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Funcionario>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<Cargo>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<Escala>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<EscalaDetalhe>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<EscalaDetalhe>()
                .HasOne(d => d.Escala)
                .WithMany(e => e.Detalhes)
                .HasForeignKey(d => d.EscalaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FuncionarioEscala>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<FuncionarioEscala>()
                .HasOne(fe => fe.Funcionario)
                .WithMany()
                .HasForeignKey(fe => fe.FuncionarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FuncionarioEscala>()
                .HasOne(fe => fe.Escala)
                .WithMany(e => e.FuncionarioEscalas)
                .HasForeignKey(fe => fe.EscalaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RegistroPonto>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();

            modelBuilder.Entity<RegistroPonto>()
                .HasOne(r => r.Escala)
                .WithMany()
                .HasForeignKey(r => r.EscalaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<RegistroPonto>()
                .HasOne(r => r.FuncionarioEscalaVinculo)
                .WithMany()
                .HasForeignKey(r => r.FuncionarioEscalaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Ferias>()
                .Property(e => e.Id)
                .UseIdentityAlwaysColumn();
        }
    }
}
