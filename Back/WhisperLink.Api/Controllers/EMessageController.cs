using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Executions;
using WhisperLink.Domain.Models.Messages;

namespace WhisperLink.Api.Controllers
{
    [ApiController]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly MessageExecution _messageExecution;

        public MessageController(MessageExecution messageExecution)
        {
            _messageExecution = messageExecution;
        }

        [HttpGet("api/conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var conversations = await _messageExecution.GetConversationsAsync(userId);

            var result = conversations.Select(c => new
            {
                id = c.User.Id.ToString(),
                title = c.User.DisplayName,
                lastMessage = c.LastMessage?.Content ?? "",
                lastMessageTime = c.LastMessage?.CreatedAt.ToString("o") ?? "",
                unreadCount = c.UnreadCount,
                participantIds = new[] { c.User.Id.ToString() }
            });

            return Ok(result);
        }

        [HttpGet("api/conversations/{conversationId}/messages")]
        public async Task<IActionResult> GetMessages(int conversationId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var messages = await _messageExecution.GetConversationWithUserAsync(userId, conversationId);

            var result = messages.Select(m => new
            {
                id = m.Id.ToString(),
                conversationId = conversationId.ToString(),
                authorId = m.SenderId.ToString(),
                text = m.Content,
                createdAt = m.CreatedAt.ToString("o")
            });

            return Ok(result);
        }

        [HttpPost("api/messages")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageFrontendDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int senderId))
                return Unauthorized(new { message = "Invalid token" });

            if (!int.TryParse(dto.ConversationId, out int receiverId))
                return BadRequest(new { message = "Invalid conversationId" });

            var message = await _messageExecution.SendMessageAsync(senderId, new SendMessageDto
            {
                ReceiverId = receiverId,
                Content = dto.Text
            });

            if (message == null) return BadRequest(new { message = "Failed to send message" });

            return CreatedAtAction(nameof(SendMessage), new { id = message.Id }, new
            {
                id = message.Id.ToString(),
                conversationId = dto.ConversationId,
                authorId = senderId.ToString(),
                text = message.Content,
                createdAt = message.CreatedAt.ToString("o")
            });
        }

        [HttpPost("api/conversations")]
        public IActionResult CreateConversation([FromBody] CreateConversationDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            if (dto.ParticipantIds == null || dto.ParticipantIds.Length == 0)
                return BadRequest(new { message = "ParticipantIds required" });

            var otherUserId = dto.ParticipantIds[0];
            return Ok(new
            {
                id = otherUserId,
                title = "",
                lastMessage = "",
                lastMessageTime = "",
                unreadCount = 0,
                participantIds = dto.ParticipantIds
            });
        }

        [HttpPut("api/message/{id}/read")]
        public async Task<IActionResult> MarkMessageAsRead(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var result = await _messageExecution.MarkMessageAsReadAsync(id, userId);
            if (!result) return BadRequest(new { message = "Failed to mark message as read" });

            return Ok(new { message = "Message marked as read" });
        }

        [HttpDelete("api/message/{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var result = await _messageExecution.DeleteMessageAsync(id, userId);
            if (!result) return BadRequest(new { message = "Failed to delete message" });

            return Ok(new { message = "Message deleted successfully" });
        }
    }

    public class SendMessageFrontendDto
    {
        public string ConversationId { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }

    public class CreateConversationDto
    {
        public string[] ParticipantIds { get; set; } = Array.Empty<string>();
    }
}