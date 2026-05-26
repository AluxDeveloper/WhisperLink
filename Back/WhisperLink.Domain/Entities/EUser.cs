using System;
using System.Collections.Generic;
using WhisperLink.Domain.Enums;

namespace WhisperLink.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Handle { get; set; } = string.Empty;
        public string? JobRole { get; set; }
        public string? Bio { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public UserRole Role { get; set; } = UserRole.User;
        public UserPresence Presence { get; set; } = UserPresence.Offline;
        public DateTime? LastSeenAt { get; set; }

        public ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
        public ICollection<Friendship> RequestedFriendships { get; set; } = new List<Friendship>();
        public ICollection<Friendship> ReceivedFriendships { get; set; } = new List<Friendship>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}