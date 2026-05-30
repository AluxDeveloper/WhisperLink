using AutoMapper;
using WhisperLink.Domain.Entities;
using WhisperLink.Domain.Models.Users;
using WhisperLink.Domain.Models.Friends;
using WhisperLink.Domain.Models.Messages;

namespace WhisperLink.BusinessLayer.Core.Helpers
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Presence, opt => opt.MapFrom(src =>
                    src.Presence.ToString().ToLower()))
                .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.DisplayName))
                .ForMember(dest => dest.Handle, opt => opt.MapFrom(src => src.Handle))
                .ForMember(dest => dest.JobRole, opt => opt.MapFrom(src => src.JobRole))
                .ForMember(dest => dest.Bio, opt => opt.MapFrom(src => src.Bio));

            CreateMap<Friendship, FriendshipDto>()
                .ForMember(dest => dest.RequesterId, opt => opt.MapFrom(src => src.RequesterId))
                .ForMember(dest => dest.AddresseeId, opt => opt.MapFrom(src => src.AddresseeId))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));

            CreateMap<Message, MessageDto>()
                .ForMember(dest => dest.SenderId, opt => opt.MapFrom(src => src.SenderId))
                .ForMember(dest => dest.ReceiverId, opt => opt.MapFrom(src => src.ReceiverId))
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Content))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));
        }
    }
}