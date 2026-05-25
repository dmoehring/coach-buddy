package de.moehring.coach.buddy.backend.training.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.person.mappers.PersonMapper;
import de.moehring.coach.buddy.backend.training.dtos.TrainingParticipantDto;
import de.moehring.coach.buddy.backend.training.entities.TrainingParticipant;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(
        config = MappingConfig.class,
        uses = {
                TrainingMapper.class,
                PersonMapper.class
        }
)
public interface TrainingParticipantMapper {

    TrainingParticipantDto mapToDto(TrainingParticipant trainingParticipant);

    List<TrainingParticipantDto> mapToDto(List<TrainingParticipant> trainingParticipants);
}