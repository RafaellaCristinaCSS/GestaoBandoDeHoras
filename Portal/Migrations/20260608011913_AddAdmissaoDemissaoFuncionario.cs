using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Migrations
{
    /// <inheritdoc />
    public partial class AddAdmissaoDemissaoFuncionario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataAdmissao",
                table: "Funcionario",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataDemissao",
                table: "Funcionario",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Funcionario\" SET \"DataAdmissao\" = COALESCE(\"StartDate\", NOW()) WHERE \"DataAdmissao\" IS NULL;");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DataAdmissao",
                table: "Funcionario",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataAdmissao",
                table: "Funcionario");

            migrationBuilder.DropColumn(
                name: "DataDemissao",
                table: "Funcionario");
        }
    }
}
