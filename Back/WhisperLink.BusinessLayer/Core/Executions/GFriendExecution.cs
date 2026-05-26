using System.Collections.Generic;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Interfaces;
using WhisperLink.Domain.Models.Friends;

namespace WhisperLink.BusinessLayer.Core.Executions
{
    public class FriendExecution
    {
        private readonly IFriendAction _friendAction;

        public FriendExecution(IFriendAction friendAction)
        {
            _friendAction = friendAction;
        }

        public async Task<FriendshipDto?> SendFriendRequestAsync(int requesterId, SendFriendRequestDto requestDto)
            => await _friendAction.SendFriendRequestAsync(requesterId, requestDto);

        public async Task<FriendshipDto?> AcceptFriendRequestAsync(int friendshipId, int userId)
            => await _friendAction.AcceptFriendRequestAsync(friendshipId, userId);

        public async Task<bool> RejectFriendRequestAsync(int friendshipId, int userId)
            => await _friendAction.RejectFriendRequestAsync(friendshipId, userId);

        public async Task<IEnumerable<FriendshipDto>> GetFriendsAsync(int userId)
            => await _friendAction.GetFriendsAsync(userId);

        public async Task<IEnumerable<FriendshipDto>> GetPendingRequestsAsync(int userId)
            => await _friendAction.GetPendingRequestsAsync(userId);

        public async Task<bool> RemoveFriendAsync(int friendshipId, int userId)
            => await _friendAction.RemoveFriendAsync(friendshipId, userId);

        // Metodă nouă pentru frontend
        public async Task<bool> RemoveFriendByUserIdAsync(int currentUserId, int friendUserId)
            => await _friendAction.RemoveFriendByUserIdAsync(currentUserId, friendUserId);

        public async Task<bool> BlockUserAsync(int friendshipId, int userId)
            => await _friendAction.BlockUserAsync(friendshipId, userId);
    }
}