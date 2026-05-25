package de.moehring.coach.buddy.backend.training.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.team.mappers.TeamMapper;
import de.moehring.coach.buddy.backend.training.dtos.TrainingDto;
import de.moehring.coach.buddy.backend.training.entities.Training;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(
        config = MappingConfig.class,
        uses = TeamMapper.class
)
public interface TrainingMapper {

    TrainingDto mapToDto(Training training);

    List<TrainingDto> mapToDto(List<Training> trainings);
}