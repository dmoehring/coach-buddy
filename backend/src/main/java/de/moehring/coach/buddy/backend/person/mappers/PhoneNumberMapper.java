package de.moehring.coach.buddy.backend.person.mappers;

import de.moehring.coach.buddy.backend.common.mappers.MappingConfig;
import de.moehring.coach.buddy.backend.person.dtos.PhoneNumberDto;
import de.moehring.coach.buddy.backend.person.entities.PhoneNumber;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(config = MappingConfig.class)
public interface PhoneNumberMapper {
    PhoneNumberDto mapToDto(PhoneNumber phoneNumber);
    List<PhoneNumberDto> mapToDto(List<PhoneNumber> phoneNumbers);
}
