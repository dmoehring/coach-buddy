package de.moehring.coach.buddy.backend.person.services;

import de.moehring.coach.buddy.backend.person.dtos.ChildDto;
import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import de.moehring.coach.buddy.backend.person.mappers.PersonMapper;
import de.moehring.coach.buddy.backend.person.repositories.PersonRelationRepository;
import de.moehring.coach.buddy.backend.person.repositories.PersonRepository;
import de.moehring.coach.buddy.backend.person.search.PersonSearchCriteria;
import de.moehring.coach.buddy.backend.person.util.RelationType;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class PersonService {
    private final PersonRepository personRepository;
    private final PersonRelationRepository personRelationRepository;

    private final PersonMapper personMapper;

    public PersonService(PersonRepository personRepository, PersonRelationRepository personRelationRepository, PersonMapper personMapper) {
        this.personRepository = personRepository;
        this.personRelationRepository = personRelationRepository;
        this.personMapper = personMapper;
    }

    public List<PersonDto> findAll(PersonSearchCriteria personSearchCriteria) {
        return personRepository.search(personSearchCriteria)
                .stream()
                .map(personMapper::mapToDto)
                .toList();
    }

    public List<ChildDto> findAllChildren() {
        List<PersonRelation> relations = personRelationRepository.listAll();

        Map<Person, List<PersonRelation>> relationsByChild = relations.stream()
                .collect(Collectors.groupingBy(PersonRelation::getChildPerson));


        return relationsByChild.entrySet().stream()
                .map(entry -> {
                    Person child = entry.getKey();
                    List<PersonRelation> childRelations = entry.getValue();

                    Map<RelationType, List<PersonDto>> guardians = childRelations.stream()
                            .collect(Collectors.groupingBy(
                                    PersonRelation::getRelationType,
                                    Collectors.mapping(
                                            relation -> personMapper.mapToDto(relation.getGuardianPerson()),
                                            Collectors.toList()
                                    )
                            ));

                    return new ChildDto(
                            personMapper.mapToDto(child),
                            guardians
                    );
                })
                .toList();
    }

    public PersonDto findById(UUID id) {
        return personMapper.mapToDto(personRepository.findById(id));
    }
}
