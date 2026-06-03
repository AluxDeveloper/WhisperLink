using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Executions;
using WhisperLink.Domain.Models.Messages;

namespace WhisperLink.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly MessageExecution _messageExecution;

        public ChatHub(MessageExecution messageExecution)
        {
            _messageExecution = messageExecution;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
            {
                await Clients.Others.SendAsync("UserOnline", userId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
            {
                await Clients.Others.SendAsync("UserOffline", userId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(int receiverId, string content, int? replyToId = null)
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int senderId))
                return;

            var sendMessageDto = new SendMessageDto
            {
                ReceiverId = receiverId,
                Content = content,
                ReplyToId = replyToId
            };

            var message = await _messageExecution.SendMessageAsync(senderId, sendMessageDto);
            if (message == null) return;

            await Clients.User(receiverId.ToString()).SendAsync("ReceiveMessage", message);
            await Clients.Caller.SendAsync("MessageSent", message);
            await Clients.Caller.SendAsync("MessageDelivered", message.Id.ToString());
        }

        public async Task EditMessage(int messageId, string newContent)
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return;

            var result = await _messageExecution.EditMessageAsync(messageId, userId, newContent);
            if (result)
            {
                await Clients.All.SendAsync("MessageEdited", new { messageId, newContent });
            }
        }

        public async Task DeleteMessage(int messageId)
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return;

            var result = await _messageExecution.DeleteMessageAsync(messageId, userId);
            if (result)
            {
                await Clients.All.SendAsync("MessageDeleted", messageId.ToString());
            }
        }

        public async Task MarkAsRead(int messageId)
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return;

            var result = await _messageExecution.MarkMessageAsReadAsync(messageId, userId);
            if (result)
            {
                await Clients.All.SendAsync("MessageRead", messageId, userId);
                await Clients.All.SendAsync("MessageSeen", messageId.ToString());
            }
        }

        public async Task StartTyping(int receiverId)
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int senderId))
                return;

            await Clients.User(receiverId.ToString()).SendAsync("UserTyping", senderId.ToString());
        }

        public async Task StopTyping(int receiverId)
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int senderId))
                return;

            await Clients.User(receiverId.ToString()).SendAsync("UserStoppedTyping", senderId.ToString());
        }
    }
}