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
using WhisperLink.Domain.Models.Friends;

namespace WhisperLink.BusinessLayer.Core.Actions
{
    public class FriendActions : IFriendAction
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public FriendActions(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<FriendshipDto?> SendFriendRequestAsync(int requesterId, SendFriendRequestDto requestDto)
        {
            if (requesterId == requestDto.AddresseeId) return null;

            var addresseeExists = await _context.Users.AnyAsync(u => u.Id == requestDto.AddresseeId);
            if (!addresseeExists) return null;

            var existingRequest = await _context.Friendships.AnyAsync(f =>
                (f.RequesterId == requesterId && f.AddresseeId == requestDto.AddresseeId) ||
                (f.RequesterId == requestDto.AddresseeId && f.AddresseeId == requesterId)
            );
            if (existingRequest) return null;

            var friendship = new Friendship
            {
                RequesterId = requesterId,
                AddresseeId = requestDto.AddresseeId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(friendship);
            await _context.SaveChangesAsync();

            var friendshipWithUsers = await _context.Friendships
                .Include(f => f.Requester)
                .Include(f => f.Addressee)
                .FirstOrDefaultAsync(f => f.Id == friendship.Id);

            return _mapper.Map<FriendshipDto>(friendshipWithUsers);
        }

        public async Task<FriendshipDto?> AcceptFriendRequestAsync(int friendshipId, int userId)
        {
            var friendship = await _context.Friendships
                .Include(f => f.Requester)
                .Include(f => f.Addressee)
                .FirstOrDefaultAsync(f => f.Id == friendshipId);

            if (friendship == null) return null;
            if (friendship.AddresseeId != userId) return null;
            if (friendship.Status != FriendshipStatus.Pending) return null;

            friendship.Status = FriendshipStatus.Accepted;
            friendship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return _mapper.Map<FriendshipDto>(friendship);
        }

        public async Task<bool> RejectFriendRequestAsync(int friendshipId, int userId)
        {
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f => f.Id == friendshipId);
            if (friendship == null) return false;
            if (friendship.AddresseeId != userId) return false;
            if (friendship.Status != FriendshipStatus.Pending) return false;

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<FriendshipDto>> GetFriendsAsync(int userId)
        {
            var friendships = await _context.Friendships
                .Include(f => f.Requester)
                .Include(f => f.Addressee)
                .Where(f =>
                    f.Status == FriendshipStatus.Accepted &&
                    (f.RequesterId == userId || f.AddresseeId == userId)
                )
                .OrderByDescending(f => f.UpdatedAt)
                .ToListAsync();

            return _mapper.Map<List<FriendshipDto>>(friendships);
        }

        public async Task<IEnumerable<FriendshipDto>> GetPendingRequestsAsync(int userId)
        {
            var requests = await _context.Friendships
                .Include(f => f.Requester)
                .Include(f => f.Addressee)
                .Where(f => f.Status == FriendshipStatus.Pending && f.AddresseeId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<FriendshipDto>>(requests);
        }

        public async Task<bool> RemoveFriendAsync(int friendshipId, int userId)
        {
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f => f.Id == friendshipId);
            if (friendship == null) return false;
            if (friendship.RequesterId != userId && friendship.AddresseeId != userId) return false;
            if (friendship.Status != FriendshipStatus.Accepted) return false;

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            return true;
        }

        // Metodă nouă - frontend trimite userId-ul prietenului, nu friendshipId
        public async Task<bool> RemoveFriendByUserIdAsync(int currentUserId, int friendUserId)
        {
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.RequesterId == currentUserId && f.AddresseeId == friendUserId) ||
                 (f.RequesterId == friendUserId && f.AddresseeId == currentUserId))
            );

            if (friendship == null) return false;

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> BlockUserAsync(int friendshipId, int userId)
        {
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f => f.Id == friendshipId);
            if (friendship == null) return false;
            if (friendship.RequesterId != userId && friendship.AddresseeId != userId) return false;

            friendship.Status = FriendshipStatus.Blocked;
            friendship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}