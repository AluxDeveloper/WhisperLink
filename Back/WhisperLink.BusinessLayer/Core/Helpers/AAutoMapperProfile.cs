using AutoMapper;
using WhisperLink.Domain.Entities;
using WhisperLink.Domain.Models.Users;

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
        }
    }
}