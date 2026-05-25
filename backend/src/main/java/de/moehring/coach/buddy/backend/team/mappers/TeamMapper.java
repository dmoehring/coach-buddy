package de.moehring.coach.buddy.backend.team.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.team.dtos.TeamDto;
import de.moehring.coach.buddy.backend.team.entities.Team;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(config = MappingConfig.class)
public interface TeamMapper {

    @Mapping(source = "season.id", target = "seasonId")
    @Mapping(source = "season.name", target = "seasonName")
    TeamDto mapToDto(Team team);

    List<TeamDto> mapToDto(List<Team> teams);
}
