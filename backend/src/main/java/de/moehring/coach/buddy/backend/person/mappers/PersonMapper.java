package de.moehring.coach.buddy.backend.person.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.person.entities.Person;
import org.mapstruct.Mapper;

@Mapper(
        config = MappingConfig.class,
        uses = PhoneNumberMapper.class
)
public interface PersonMapper {
    PersonDto mapToDto(Person person);
}
