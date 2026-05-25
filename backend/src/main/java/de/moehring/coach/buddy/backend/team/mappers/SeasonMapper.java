package de.moehring.coach.buddy.backend.team.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.team.dtos.SeasonDto;
import de.moehring.coach.buddy.backend.team.entities.Season;
import org.mapstruct.Mapper;

@Mapper(config = MappingConfig.class)
public interface SeasonMapper {
    SeasonDto mapToDto(Season season);
}
