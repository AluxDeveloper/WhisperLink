using System;
using WhisperLink.Domain.Enums;

namespace WhisperLink.Domain.Entities
{
    public class Message : BaseEntity
    {
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
        public MessageStatus Status { get; set; } = MessageStatus.Sent;
        public DateTime? ReadAt { get; set; }
        public bool IsEdited { get; set; } = false;
        public int? ReplyToId { get; set; }

        public User Sender { get; set; } = null!;
        public User Receiver { get; set; } = null!;
        public Message? ReplyTo { get; set; }
    }
}