using System;
using WhisperLink.Domain.Enums;
using WhisperLink.Domain.Models.Users;

namespace WhisperLink.Domain.Models.Messages
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
        public MessageStatus Status { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsEdited { get; set; }
        public int? ReplyToId { get; set; }
        public ReplyPreviewDto? ReplyTo { get; set; }
        public UserDto Sender { get; set; } = null!;
        public UserDto Receiver { get; set; } = null!;
    }

    public class ReplyPreviewDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
    }
}