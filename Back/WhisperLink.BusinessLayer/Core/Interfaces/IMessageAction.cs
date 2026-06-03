using System.Collections.Generic;
using System.Threading.Tasks;
using WhisperLink.Domain.Models.Messages;

namespace WhisperLink.BusinessLayer.Core.Interfaces
{
    public interface IMessageAction
    {
        Task<MessageDto?> SendMessageAsync(int senderId, SendMessageDto sendMessageDto);
        Task<IEnumerable<ConversationDto>> GetConversationsAsync(int userId);
        Task<IEnumerable<MessageDto>> GetConversationWithUserAsync(int userId, int otherUserId);
        Task<bool> MarkMessageAsReadAsync(int messageId, int userId);
        Task<bool> DeleteMessageAsync(int messageId, int userId);
        Task<bool> EditMessageAsync(int messageId, int userId, string newContent);
    }
}