using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Executions;
using WhisperLink.DataAccess.Context;
using WhisperLink.Domain.Enums;
using WhisperLink.Domain.Models.Users;
using AutoMapper;

namespace WhisperLink.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly UserExecution _userExecution;
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public UserController(UserExecution userExecution, AppDbContext context, IMapper mapper)
        {
            _userExecution = userExecution;
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers([FromQuery] string? search = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out int currentUserId);

            var users = await _userExecution.GetAllUsersAsync(search);
            var result = users
                .Where(u => u.Id != currentUserId)
                .Select(u => new
                {
                    id = u.Id.ToString(),
                    name = u.DisplayName,
                    handle = u.Handle,
                    email = u.Email,
                    role = u.JobRole,
                    avatarUrl = u.ProfilePictureUrl,
                    status = u.Presence
                });
            return Ok(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? q = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out int currentUserId);

            var users = await _userExecution.GetAllUsersAsync(q);
            var result = users
                .Where(u => u.Id != currentUserId)
                .Select(u => new
                {
                    id = u.Id.ToString(),
                    name = u.DisplayName,
                    handle = u.Handle,
                    email = u.Email,
                    role = u.JobRole,
                    avatarUrl = u.ProfilePictureUrl,
                    status = u.Presence
                });
            return Ok(result);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var user = await _userExecution.GetUserByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User not found" });

            return Ok(new
            {
                id = user.Id.ToString(),
                name = user.DisplayName,
                handle = user.Handle,
                email = user.Email,
                bio = user.Bio,
                role = user.JobRole,
                avatarUrl = user.ProfilePictureUrl,
                status = user.Presence
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userExecution.GetUserByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });
            return Ok(user);
        }

        [HttpPatch("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateUserDto updateDto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var updatedUser = await _userExecution.UpdateUserAsync(userId, updateDto);
            if (updatedUser == null) return NotFound(new { message = "User not found" });

            return Ok(new
            {
                id = updatedUser.Id.ToString(),
                name = updatedUser.DisplayName,
                handle = updatedUser.Handle,
                email = updatedUser.Email,
                bio = updatedUser.Bio,
                role = updatedUser.JobRole,
                avatarUrl = updatedUser.ProfilePictureUrl,
                status = updatedUser.Presence
            });
        }

        [HttpPatch("me/status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found" });

            user.Presence = request.Status?.ToLower() switch
            {
                "online" => UserPresence.Online,
                "focus" => UserPresence.Focus,
                "away" => UserPresence.Away,
                _ => UserPresence.Offline
            };
            user.LastSeenAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { status = user.Presence.ToString().ToLower() });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto updateDto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized(new { message = "Invalid token" });

            if (id != currentUserId) return Forbid();

            var updatedUser = await _userExecution.UpdateUserAsync(id, updateDto);
            if (updatedUser == null) return NotFound(new { message = "User not found" });

            return Ok(updatedUser);
        }

        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var result = await _userExecution.ChangePasswordAsync(userId, changePasswordDto);
            if (!result) return BadRequest(new { message = "Current password is incorrect" });

            return Ok(new { message = "Password changed successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                return Unauthorized(new { message = "Invalid token" });

            if (id != currentUserId) return Forbid();

            var result = await _userExecution.DeleteUserAsync(id);
            if (!result) return NotFound(new { message = "User not found" });

            return Ok(new { message = "User deleted successfully" });
        }
    }

    public class UpdateStatusRequest
    {
        public string? Status { get; set; }
    }
}