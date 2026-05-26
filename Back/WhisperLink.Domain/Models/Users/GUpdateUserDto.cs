namespace WhisperLink.Domain.Models.Users
{
    public class UpdateUserDto
    {
        public string? DisplayName { get; set; }
        public string? Handle { get; set; }
        public string? Bio { get; set; }
        public string? JobRole { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}