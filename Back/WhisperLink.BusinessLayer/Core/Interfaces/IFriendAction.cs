using System.Collections.Generic;
using System.Threading.Tasks;
using WhisperLink.Domain.Models.Friends;

namespace WhisperLink.BusinessLayer.Core.Interfaces
{
    public interface IFriendAction
    {
        Task<FriendshipDto?> SendFriendRequestAsync(int requesterId, SendFriendRequestDto requestDto);
        Task<FriendshipDto?> AcceptFriendRequestAsync(int friendshipId, int userId);
        Task<bool> RejectFriendRequestAsync(int friendshipId, int userId);
        Task<IEnumerable<FriendshipDto>> GetFriendsAsync(int userId);
        Task<IEnumerable<FriendshipDto>> GetPendingRequestsAsync(int userId);
        Task<bool> RemoveFriendAsync(int friendshipId, int userId);
        Task<bool> RemoveFriendByUserIdAsync(int currentUserId, int friendUserId);
        Task<bool> BlockUserAsync(int friendshipId, int userId);
    }
}