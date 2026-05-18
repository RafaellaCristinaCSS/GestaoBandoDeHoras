using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Migrations
{
    /// <inheritdoc />
    public partial class AddEscalaRefToRegistroPonto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EscalaId",
                table: "RegistroPonto",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FuncionarioEscalaId",
                table: "RegistroPonto",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RegistroPonto_EscalaId",
                table: "RegistroPonto",
                column: "EscalaId");

            migrationBuilder.CreateIndex(
                name: "IX_RegistroPonto_FuncionarioEscalaId",
                table: "RegistroPonto",
                column: "FuncionarioEscalaId");

            migrationBuilder.AddForeignKey(
                name: "FK_RegistroPonto_Escala_EscalaId",
                table: "RegistroPonto",
                column: "EscalaId",
                principalTable: "Escala",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RegistroPonto_FuncionarioEscala_FuncionarioEscalaId",
                table: "RegistroPonto",
                column: "FuncionarioEscalaId",
                principalTable: "FuncionarioEscala",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RegistroPonto_Escala_EscalaId",
                table: "RegistroPonto");

            migrationBuilder.DropForeignKey(
                name: "FK_RegistroPonto_FuncionarioEscala_FuncionarioEscalaId",
                table: "RegistroPonto");

            migrationBuilder.DropIndex(
                name: "IX_RegistroPonto_EscalaId",
                table: "RegistroPonto");

            migrationBuilder.DropIndex(
                name: "IX_RegistroPonto_FuncionarioEscalaId",
                table: "RegistroPonto");

            migrationBuilder.DropColumn(
                name: "EscalaId",
                table: "RegistroPonto");

            migrationBuilder.DropColumn(
                name: "FuncionarioEscalaId",
                table: "RegistroPonto");
        }
    }
}
