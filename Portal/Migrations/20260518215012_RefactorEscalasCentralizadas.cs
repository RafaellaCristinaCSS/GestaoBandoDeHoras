using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Portal.Migrations
{
    /// <inheritdoc />
    public partial class RefactorEscalasCentralizadas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Escala_Funcionario_FuncionarioId",
                table: "Escala");

            migrationBuilder.DropIndex(
                name: "IX_Escala_FuncionarioId",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "ChangeDate",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "DiaSemana",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "Excluded",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "FuncionarioId",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "HoraAlmocoFim",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "HoraFim",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Escala");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "Escala",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "HorasPrevistas",
                table: "Escala",
                newName: "CargaHorariaSemanal");

            migrationBuilder.RenameColumn(
                name: "HoraInicio",
                table: "Escala",
                newName: "Nome");

            migrationBuilder.RenameColumn(
                name: "HoraAlmocoInicio",
                table: "Escala",
                newName: "Descricao");

            migrationBuilder.RenameColumn(
                name: "Folga",
                table: "Escala",
                newName: "Ativa");

            migrationBuilder.RenameColumn(
                name: "EscalaId",
                table: "Escala",
                newName: "TipoEscala");

            migrationBuilder.CreateTable(
                name: "EscalaDetalhe",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    EscalaId = table.Column<int>(type: "integer", nullable: false),
                    DiaSemana = table.Column<int>(type: "integer", nullable: false),
                    HoraInicio = table.Column<string>(type: "text", nullable: false),
                    HoraFim = table.Column<string>(type: "text", nullable: false),
                    HoraAlmocoInicio = table.Column<string>(type: "text", nullable: true),
                    HoraAlmocoFim = table.Column<string>(type: "text", nullable: true),
                    HorasPrevistas = table.Column<decimal>(type: "numeric", nullable: false),
                    Folga = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EscalaDetalhe", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EscalaDetalhe_Escala_EscalaId",
                        column: x => x.EscalaId,
                        principalTable: "Escala",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FuncionarioEscala",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    FuncionarioId = table.Column<int>(type: "integer", nullable: false),
                    EscalaId = table.Column<int>(type: "integer", nullable: false),
                    DataInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataFim = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuncionarioEscala", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FuncionarioEscala_Escala_EscalaId",
                        column: x => x.EscalaId,
                        principalTable: "Escala",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FuncionarioEscala_Funcionario_FuncionarioId",
                        column: x => x.FuncionarioId,
                        principalTable: "Funcionario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EscalaDetalhe_EscalaId",
                table: "EscalaDetalhe",
                column: "EscalaId");

            migrationBuilder.CreateIndex(
                name: "IX_FuncionarioEscala_EscalaId",
                table: "FuncionarioEscala",
                column: "EscalaId");

            migrationBuilder.CreateIndex(
                name: "IX_FuncionarioEscala_FuncionarioId",
                table: "FuncionarioEscala",
                column: "FuncionarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EscalaDetalhe");

            migrationBuilder.DropTable(
                name: "FuncionarioEscala");

            migrationBuilder.RenameColumn(
                name: "TipoEscala",
                table: "Escala",
                newName: "EscalaId");

            migrationBuilder.RenameColumn(
                name: "Nome",
                table: "Escala",
                newName: "HoraInicio");

            migrationBuilder.RenameColumn(
                name: "Descricao",
                table: "Escala",
                newName: "HoraAlmocoInicio");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Escala",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "CargaHorariaSemanal",
                table: "Escala",
                newName: "HorasPrevistas");

            migrationBuilder.RenameColumn(
                name: "Ativa",
                table: "Escala",
                newName: "Folga");

            migrationBuilder.AddColumn<DateTime>(
                name: "ChangeDate",
                table: "Escala",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Escala",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "DiaSemana",
                table: "Escala",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "Excluded",
                table: "Escala",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "FuncionarioId",
                table: "Escala",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HoraAlmocoFim",
                table: "Escala",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HoraFim",
                table: "Escala",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "UpdatedByUserId",
                table: "Escala",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Escala_FuncionarioId",
                table: "Escala",
                column: "FuncionarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Escala_Funcionario_FuncionarioId",
                table: "Escala",
                column: "FuncionarioId",
                principalTable: "Funcionario",
                principalColumn: "Id");
        }
    }
}
