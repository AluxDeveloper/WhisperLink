using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Executions;
using WhisperLink.BusinessLayer.Core.Helpers;
using WhisperLink.DataAccess.Context;
using WhisperLink.Domain.Entities;
using WhisperLink.Domain.Enums;
using AutoMapper;

namespace WhisperLink.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthExecution _authExecution;
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly JwtTokenGenerator _jwtGenerator;

        public AuthController(AuthExecution authExecution, AppDbContext context, IMapper mapper, JwtTokenGenerator jwtGenerator)
        {
            _authExecution = authExecution;
            _context = context;
            _mapper = mapper;
            _jwtGenerator = jwtGenerator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest(new { message = "Toate câmpurile sunt obligatorii" });

                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                    return BadRequest(new { message = "Email already exists" });

                var baseName = request.Name.ToLower().Replace(" ", "");
                var username = baseName;
                var handle = "@" + baseName;

                if (await _context.Users.AnyAsync(u => u.Username == username))
                {
                    var suffix = new Random().Next(100, 999).ToString();
                    username = baseName + suffix;
                    handle = "@" + baseName + suffix;
                }

                var user = new User
                {
                    Username = username,
                    DisplayName = request.Name,
                    Handle = handle,
                    Email = request.Email,
                    PasswordHash = PasswordHasher.HashPassword(request.Password),
                    Role = UserRole.User,
                    Presence = UserPresence.Online,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var token = _jwtGenerator.GenerateToken(user);
                var refreshToken = _jwtGenerator.GenerateRefreshToken();

                _context.RefreshTokens.Add(new RefreshToken
                {
                    UserId = user.Id,
                    Token = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddDays(7),
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    token,
                    refreshToken,
                    user = new
                    {
                        id = user.Id.ToString(),
                        name = user.DisplayName,
                        email = user.Email,
                        handle = user.Handle,
                        avatarUrl = user.ProfilePictureUrl
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Registration failed", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest(new { message = "Email și parola sunt obligatorii" });

                var user = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email == request.Email || u.Username == request.Email);

                if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
                    return Unauthorized(new { message = "Invalid credentials" });

                user.Presence = UserPresence.Online;
                user.LastSeenAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var token = _jwtGenerator.GenerateToken(user);
                var refreshToken = _jwtGenerator.GenerateRefreshToken();

                _context.RefreshTokens.Add(new RefreshToken
                {
                    UserId = user.Id,
                    Token = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddDays(7),
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    token,
                    refreshToken,
                    user = new
                    {
                        id = user.Id.ToString(),
                        name = user.DisplayName,
                        email = user.Email,
                        handle = user.Handle,
                        avatarUrl = user.ProfilePictureUrl
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Login failed", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.Presence = UserPresence.Offline;
                user.LastSeenAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            await _authExecution.LogoutAsync(userId);
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
                return BadRequest(new { message = "Refresh token is required" });

            var result = await _authExecution.RefreshTokenAsync(request.RefreshToken);
            if (!result.Success)
                return Unauthorized(new { message = "Invalid or expired refresh token" });

            return Ok(new { token = result.Token });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Invalid token" });

            var user = await _authExecution.GetCurrentUserAsync(userId);
            if (user == null) return NotFound(new { message = "User not found" });

            return Ok(user);
        }
    }

    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}