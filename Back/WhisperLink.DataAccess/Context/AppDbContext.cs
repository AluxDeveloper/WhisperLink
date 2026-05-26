using Microsoft.EntityFrameworkCore;
using WhisperLink.Domain.Entities;

namespace WhisperLink.DataAccess.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // USER
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();
                // fără HasIndex pe Handle

                entity.Property(u => u.DisplayName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.Handle)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(u => u.JobRole)
                    .HasMaxLength(100);

                entity.Property(u => u.Bio)
                    .HasMaxLength(500);

                entity.Property(u => u.Username)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(u => u.Email)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.ProfilePictureUrl)
                    .HasMaxLength(500);

                entity.Property(u => u.Presence)
                    .HasDefaultValue(Domain.Enums.UserPresence.Offline);
            });

            // MESSAGE
            modelBuilder.Entity<Message>(entity =>
            {
                entity.ToTable("messages");

                entity.HasOne(m => m.Sender)
                    .WithMany(u => u.SentMessages)
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Receiver)
                    .WithMany(u => u.ReceivedMessages)
                    .HasForeignKey(m => m.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // FRIENDSHIP
            modelBuilder.Entity<Friendship>(entity =>
            {
                entity.ToTable("friendships");

                entity.HasOne(f => f.Requester)
                    .WithMany(u => u.RequestedFriendships)
                    .HasForeignKey(f => f.RequesterId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(f => f.Addressee)
                    .WithMany(u => u.ReceivedFriendships)
                    .HasForeignKey(f => f.AddresseeId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // REFRESH TOKEN
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("refresh_tokens");

                entity.HasOne(rt => rt.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}