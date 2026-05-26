using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WhisperLink.BusinessLayer.Core.Helpers;
using WhisperLink.BusinessLayer.Core.Interfaces;
using WhisperLink.DataAccess.Context;
using WhisperLink.Domain.Models.Users;

namespace WhisperLink.BusinessLayer.Core.Actions
{
    public class UserActions : IUserAction
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public UserActions(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync(string? search = null)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(u =>
                    u.Username.ToLower().Contains(search) ||
                    u.Email.ToLower().Contains(search) ||
                    u.DisplayName.ToLower().Contains(search) ||
                    (u.Handle != null && u.Handle.ToLower().Contains(search)) ||
                    (u.JobRole != null && u.JobRole.ToLower().Contains(search))
                );
            }

            var users = await query.ToListAsync();
            return _mapper.Map<List<UserDto>>(users);
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            if (updateDto.DisplayName != null) user.DisplayName = updateDto.DisplayName;
            if (updateDto.Handle != null) user.Handle = updateDto.Handle;
            if (updateDto.Bio != null) user.Bio = updateDto.Bio;
            if (updateDto.JobRole != null) user.JobRole = updateDto.JobRole;
            if (updateDto.ProfilePictureUrl != null) user.ProfilePictureUrl = updateDto.ProfilePictureUrl;

            user.UpdatedAt = System.DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            if (!PasswordHasher.VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
                return false;

            user.PasswordHash = PasswordHasher.HashPassword(changePasswordDto.NewPassword);
            user.UpdatedAt = System.DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}