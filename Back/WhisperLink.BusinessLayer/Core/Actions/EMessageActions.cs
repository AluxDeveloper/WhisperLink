using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Interfaces;
using WhisperLink.DataAccess.Context;
using WhisperLink.Domain.Entities;
using WhisperLink.Domain.Enums;
using WhisperLink.Domain.Models.Messages;
using WhisperLink.Domain.Models.Users;

namespace WhisperLink.BusinessLayer.Core.Actions
{
    public class MessageActions : IMessageAction
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MessageActions(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<MessageDto?> SendMessageAsync(int senderId, SendMessageDto sendMessageDto)
        {
            var receiverExists = await _context.Users.AnyAsync(u => u.Id == sendMessageDto.ReceiverId);
            if (!receiverExists) return null;
            if (senderId == sendMessageDto.ReceiverId) return null;

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = sendMessageDto.ReceiverId,
                Content = sendMessageDto.Content,
                Status = MessageStatus.Sent,
                CreatedAt = DateTime.UtcNow,
                ReplyToId = sendMessageDto.ReplyToId,
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var messageWithUsers = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.ReplyTo)
                    .ThenInclude(r => r != null ? r.Sender : null)
                .FirstOrDefaultAsync(m => m.Id == message.Id);

            return MapToDto(messageWithUsers!);
        }

        public async Task<IEnumerable<ConversationDto>> GetConversationsAsync(int userId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var conversations = messages
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(group =>
                {
                    var lastMessage = group.First();
                    var unreadCount = group.Count(m => m.ReceiverId == userId && m.Status != MessageStatus.Read);
                    var otherUser = lastMessage.SenderId == userId ? lastMessage.Receiver : lastMessage.Sender;

                    return new ConversationDto
                    {
                        User = _mapper.Map<UserDto>(otherUser),
                        LastMessage = MapToDto(lastMessage),
                        UnreadCount = unreadCount
                    };
                })
                .OrderByDescending(c => c.LastMessage.CreatedAt)
                .ToList();

            return conversations;
        }

        public async Task<IEnumerable<MessageDto>> GetConversationWithUserAsync(int userId, int otherUserId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.ReplyTo)
                    .ThenInclude(r => r != null ? r.Sender : null)
                .Where(m =>
                    (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                    (m.SenderId == otherUserId && m.ReceiverId == userId)
                )
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            return messages.Select(MapToDto).ToList();
        }

        public async Task<bool> MarkMessageAsReadAsync(int messageId, int userId)
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null) return false;
            if (message.ReceiverId != userId) return false;
            if (message.Status == MessageStatus.Read) return true;

            message.Status = MessageStatus.Read;
            message.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteMessageAsync(int messageId, int userId)
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null) return false;
            if (message.SenderId != userId) return false;

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> EditMessageAsync(int messageId, int userId, string newContent)
        {
            var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null) return false;
            if (message.SenderId != userId) return false;

            message.Content = newContent;
            message.IsEdited = true;
            message.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        private MessageDto MapToDto(Message m)
        {
            return new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                ReceiverId = m.ReceiverId,
                Content = m.Content,
                Status = m.Status,
                ReadAt = m.ReadAt,
                CreatedAt = m.CreatedAt,
                IsEdited = m.IsEdited,
                ReplyToId = m.ReplyToId,
                ReplyTo = m.ReplyTo != null ? new ReplyPreviewDto
                {
                    Id = m.ReplyTo.Id,
                    Content = m.ReplyTo.Content,
                    SenderName = m.ReplyTo.Sender?.DisplayName ?? m.ReplyTo.Sender?.Username ?? "",
                } : null,
                Sender = _mapper.Map<UserDto>(m.Sender),
                Receiver = _mapper.Map<UserDto>(m.Receiver),
            };
        }
    }
}