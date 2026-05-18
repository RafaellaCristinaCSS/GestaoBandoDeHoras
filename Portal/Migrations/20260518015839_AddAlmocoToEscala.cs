using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portal.Migrations
{
    /// <inheritdoc />
    public partial class AddAlmocoToEscala : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HoraAlmocoFim",
                table: "Escala",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HoraAlmocoInicio",
                table: "Escala",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HoraAlmocoFim",
                table: "Escala");

            migrationBuilder.DropColumn(
                name: "HoraAlmocoInicio",
                table: "Escala");
        }
    }
}
