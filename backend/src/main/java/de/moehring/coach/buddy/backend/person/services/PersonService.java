package de.moehring.coach.buddy.backend.person.services;

import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.person.mappers.PersonMapper;
import de.moehring.coach.buddy.backend.person.repositories.PersonRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PersonService {
    private final PersonRepository personRepository;
    private final PersonMapper personMapper;

    public PersonService(PersonRepository personRepository, PersonMapper personMapper) {
        this.personRepository = personRepository;
        this.personMapper = personMapper;
    }

    public List<PersonDto> findAll() {
        return personRepository.listAll().stream().map(personMapper::mapToDto).toList();
    }
}
