package de.moehring.coach.buddy.backend.person.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.person.dtos.PersonRelationDto;
import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(config = MappingConfig.class, uses = PersonMapper.class)
public interface PersonRelationMapper {

    PersonRelationDto mapToDto(PersonRelation personRelation);

    List<PersonRelationDto> mapToDto(List<PersonRelation> personRelations);
}
