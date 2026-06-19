using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Migrations
{
    /// <inheritdoc />
    public partial class AddFeriasToRegistroPonto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ferias_Funcionario_FuncionarioId",
                table: "Ferias");

            migrationBuilder.AddColumn<bool>(
                name: "Ferias",
                table: "RegistroPonto",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<int>(
                name: "FuncionarioId",
                table: "Ferias",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Ferias_Funcionario_FuncionarioId",
                table: "Ferias",
                column: "FuncionarioId",
                principalTable: "Funcionario",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ferias_Funcionario_FuncionarioId",
                table: "Ferias");

            migrationBuilder.DropColumn(
                name: "Ferias",
                table: "RegistroPonto");

            migrationBuilder.AlterColumn<int>(
                name: "FuncionarioId",
                table: "Ferias",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Ferias_Funcionario_FuncionarioId",
                table: "Ferias",
                column: "FuncionarioId",
                principalTable: "Funcionario",
                principalColumn: "Id");
        }
    }
}
