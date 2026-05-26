using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Helpers;
using WhisperLink.BusinessLayer.Core.Interfaces;
using WhisperLink.DataAccess.Context;
using WhisperLink.Domain.Enums;
using WhisperLink.Domain.Models.Users;

namespace WhisperLink.BusinessLayer.Core.Actions
{
    public class AuthActions : IAuthAction
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly JwtTokenGenerator _jwtGenerator;

        public AuthActions(AppDbContext context, IMapper mapper, JwtTokenGenerator jwtGenerator)
        {
            _context = context;
            _mapper = mapper;
            _jwtGenerator = jwtGenerator;
        }

        public async Task<bool> LogoutAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.Presence = UserPresence.Offline;
            user.LastSeenAt = DateTime.UtcNow;

            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Success, string? Token)> RefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity == null) return (false, null);
            if (tokenEntity.IsRevoked) return (false, null);
            if (tokenEntity.ExpiresAt < DateTime.UtcNow) return (false, null);

            var newAccessToken = _jwtGenerator.GenerateToken(tokenEntity.User);
            return (true, newAccessToken);
        }

        public async Task<object?> GetCurrentUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            return _mapper.Map<UserDto>(user);
        }
    }
}