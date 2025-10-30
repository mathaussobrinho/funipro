using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuniproApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNotesToDeals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Deals",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Deals");
        }
    }
}
