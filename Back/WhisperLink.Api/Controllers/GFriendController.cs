using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Executions;
using WhisperLink.Domain.Models.Friends;

namespace WhisperLink.Api.Controllers
{
    [ApiController]
    [Authorize]
    public class FriendController : ControllerBase
    {
        private readonly FriendExecution _friendExecution;

        public FriendController(FriendExecution friendExecution)
        {
            _friendExecution = friendExecution;
        }

        [HttpGet("api/friends")]
        public async Task<IActionResult> GetFriends()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var friends = await _friendExecution.GetFriendsAsync(userId);
            return Ok(friends);
        }

        [HttpGet("api/friends/pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var requests = await _friendExecution.GetPendingRequestsAsync(userId);
            return Ok(requests);
        }

        [HttpDelete("api/friends/{friendUserId}")]
        public async Task<IActionResult> RemoveFriend(int friendUserId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var result = await _friendExecution.RemoveFriendByUserIdAsync(userId, friendUserId);
            if (!result) return BadRequest(new { message = "Failed to remove friend" });

            return Ok(new { message = "Friend removed successfully" });
        }

        [HttpPost("api/friend-requests")]
        public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestFrontendDto requestDto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int requesterId))
                return Unauthorized(new { message = "Invalid token" });

            var dto = new SendFriendRequestDto { AddresseeId = requestDto.ToUserId };
            var friendship = await _friendExecution.SendFriendRequestAsync(requesterId, dto);
            if (friendship == null) return BadRequest(new { message = "Friend request already exists or failed" });

            return CreatedAtAction(nameof(SendFriendRequest), new { id = friendship.Id }, new
            {
                id = friendship.Id.ToString(),
                fromUserId = friendship.RequesterId.ToString(),
                toUserId = friendship.AddresseeId.ToString(),
                status = "pending",
                createdAt = friendship.CreatedAt.ToString("o")
            });
        }

        [HttpPatch("api/friend-requests/{id}/accept")]
        public async Task<IActionResult> AcceptFriendRequest(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var friendship = await _friendExecution.AcceptFriendRequestAsync(id, userId);
            if (friendship == null) return BadRequest(new { message = "Failed to accept friend request" });

            return Ok(new
            {
                id = friendship.Id.ToString(),
                fromUserId = friendship.RequesterId.ToString(),
                toUserId = friendship.AddresseeId.ToString(),
                status = "accepted",
                createdAt = friendship.CreatedAt.ToString("o")
            });
        }

        [HttpPatch("api/friend-requests/{id}/reject")]
        public async Task<IActionResult> RejectFriendRequest(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var result = await _friendExecution.RejectFriendRequestAsync(id, userId);
            if (!result) return BadRequest(new { message = "Failed to reject friend request" });

            return Ok(new { message = "Friend request rejected", status = "rejected" });
        }

        [HttpPost("api/friend/{id}/block")]
        public async Task<IActionResult> BlockUser(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var result = await _friendExecution.BlockUserAsync(id, userId);
            if (!result) return BadRequest(new { message = "Failed to block user" });

            return Ok(new { message = "User blocked successfully" });
        }
    }

    public class SendFriendRequestFrontendDto
    {
        public int ToUserId { get; set; }
    }
}