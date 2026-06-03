using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhisperLink.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddIsEditedAndReplyTo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsEdited",
                table: "messages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ReplyToId",
                table: "messages",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_messages_ReplyToId",
                table: "messages",
                column: "ReplyToId");

            migrationBuilder.AddForeignKey(
                name: "FK_messages_messages_ReplyToId",
                table: "messages",
                column: "ReplyToId",
                principalTable: "messages",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_messages_messages_ReplyToId",
                table: "messages");

            migrationBuilder.DropIndex(
                name: "IX_messages_ReplyToId",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "IsEdited",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "ReplyToId",
                table: "messages");
        }
    }
}
