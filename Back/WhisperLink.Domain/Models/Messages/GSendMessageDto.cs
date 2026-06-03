using System.ComponentModel.DataAnnotations;

namespace WhisperLink.Domain.Models.Messages
{
    public class SendMessageDto
    {
        [Required]
        public int ReceiverId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public int? ReplyToId { get; set; }
    }
}