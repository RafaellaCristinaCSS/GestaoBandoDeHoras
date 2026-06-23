using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Portal.Migrations
{
    /// <inheritdoc />
    public partial class AddAlteracaoEscalaAuditoria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlteracaoEscalaAuditoria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    FuncionarioId = table.Column<int>(type: "integer", nullable: false),
                    EscalaAnteriorId = table.Column<int>(type: "integer", nullable: true),
                    NovaEscalaId = table.Column<int>(type: "integer", nullable: false),
                    DataVigencia = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    DataAlteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalRegistrosAnalisados = table.Column<int>(type: "integer", nullable: false),
                    TotalRegistrosImpactados = table.Column<int>(type: "integer", nullable: false),
                    RegistrosAlteradosAutomaticamente = table.Column<int>(type: "integer", nullable: false),
                    RegistrosAlteradosManualmente = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlteracaoEscalaAuditoria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlteracaoEscalaAuditoria_Funcionario_FuncionarioId",
                        column: x => x.FuncionarioId,
                        principalTable: "Funcionario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlteracaoEscalaAuditoria_FuncionarioId",
                table: "AlteracaoEscalaAuditoria",
                column: "FuncionarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlteracaoEscalaAuditoria");
        }
    }
}
