using System;
using WhisperLink.Domain.Enums;

namespace WhisperLink.Domain.Models.Users
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Handle { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? JobRole { get; set; }
        public string? Bio { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public UserRole Role { get; set; }
        public string Presence { get; set; } = "offline";
        public DateTime? LastSeenAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}