package de.moehring.coach.buddy.backend.team.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.person.mappers.PersonMapper;
import de.moehring.coach.buddy.backend.team.dtos.TeamMembershipDto;
import de.moehring.coach.buddy.backend.team.entities.TeamMembership;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(
        config = MappingConfig.class,
        uses = {
                TeamMapper.class,
                PersonMapper.class
        }
)
public interface TeamMembershipMapper {

    TeamMembershipDto mapToDto(TeamMembership teamMembership);

    List<TeamMembershipDto> mapToDto(List<TeamMembership> teamMemberships);
}