using System.Collections.Generic;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Interfaces;
using WhisperLink.Domain.Models.Messages;

namespace WhisperLink.BusinessLayer.Core.Executions
{
    public class MessageExecution
    {
        private readonly IMessageAction _messageAction;

        public MessageExecution(IMessageAction messageAction)
        {
            _messageAction = messageAction;
        }

        public async Task<MessageDto?> SendMessageAsync(int senderId, SendMessageDto sendMessageDto)
        {
            return await _messageAction.SendMessageAsync(senderId, sendMessageDto);
        }

        public async Task<IEnumerable<ConversationDto>> GetConversationsAsync(int userId)
        {
            return await _messageAction.GetConversationsAsync(userId);
        }

        public async Task<IEnumerable<MessageDto>> GetConversationWithUserAsync(int userId, int otherUserId)
        {
            return await _messageAction.GetConversationWithUserAsync(userId, otherUserId);
        }

        public async Task<bool> MarkMessageAsReadAsync(int messageId, int userId)
        {
            return await _messageAction.MarkMessageAsReadAsync(messageId, userId);
        }

        public async Task<bool> DeleteMessageAsync(int messageId, int userId)
        {
            return await _messageAction.DeleteMessageAsync(messageId, userId);
        }

        public async Task<bool> EditMessageAsync(int messageId, int userId, string newContent)
        {
            return await _messageAction.EditMessageAsync(messageId, userId, newContent);
        }
    }
}