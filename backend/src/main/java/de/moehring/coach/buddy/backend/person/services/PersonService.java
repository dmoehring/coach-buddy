package de.moehring.coach.buddy.backend.person.services;

import de.moehring.coach.buddy.backend.person.dtos.ChildDto;
import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.person.dtos.UpdatePersonRequest;
import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import de.moehring.coach.buddy.backend.person.entities.PhoneNumber;
import de.moehring.coach.buddy.backend.person.exceptions.DuplicatePersonException;
import de.moehring.coach.buddy.backend.person.exceptions.NotFoundException;
import de.moehring.coach.buddy.backend.person.mappers.PersonMapper;
import de.moehring.coach.buddy.backend.person.mappers.PersonWriteDataMapper;
import de.moehring.coach.buddy.backend.person.model.PersonWriteData;
import de.moehring.coach.buddy.backend.person.model.PhoneNumberWriteData;
import de.moehring.coach.buddy.backend.person.repositories.PersonRelationRepository;
import de.moehring.coach.buddy.backend.person.repositories.PersonRepository;
import de.moehring.coach.buddy.backend.person.search.PersonSearchCriteria;
import de.moehring.coach.buddy.backend.person.util.RelationType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@ApplicationScoped
public class PersonService {
    private final PersonRepository personRepository;
    private final PersonRelationRepository personRelationRepository;

    private final PersonMapper personMapper;
    private final PersonWriteDataMapper personWriteDataMapper;

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
        return personMapper.mapToDto(personRepository.findByIdOptional(id).orElseThrow(() -> new NotFoundException("Person wurde nicht gefunden.")));
    }

    @Transactional
    public PersonDto create(CreatePersonRequest request) {
        PersonWriteData data = personWriteDataMapper.from(request);

        validateDuplicate(null, data);

        Person person = new Person();
        applyWriteData(person, data);

        personRepository.persist(person);

        return personMapper.mapToDto(person);
    }

    @Transactional
    public PersonDto update(UUID id, UpdatePersonRequest request) {
        Person person = personRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Person wurde nicht gefunden."));

        PersonWriteData data = personWriteDataMapper.from(request);

        validateDuplicate(id, data);

        applyWriteData(person, data);

        return personMapper.mapToDto(person);
    }

    private void applyWriteData(Person person, PersonWriteData data) {
        person.setFirstName(data.firstName().trim());
        person.setLastName(data.lastName().trim());
        person.setBirthDate(data.birthDate());
        person.setNickname(trimToNull(data.nickname()));
        person.setNotes(trimToNull(data.notes()));

        person.getPhoneNumbers().clear();

        if (data.phoneNumbers() == null) {
            return;
        }

        for (PhoneNumberWriteData phoneNumberData : data.phoneNumbers()) {
            PhoneNumber phoneNumber = new PhoneNumber();
            phoneNumber.setPerson(person);
            phoneNumber.setType(phoneNumberData.type());
            phoneNumber.setNumber(phoneNumberData.number().trim());

            person.getPhoneNumbers().add(phoneNumber);
        }
    }

    private void validateDuplicate(UUID currentPersonId, PersonWriteData data) {
        String firstName = data.firstName().trim();
        String lastName = data.lastName().trim();

        boolean duplicateExists;

        if (currentPersonId == null) {
            duplicateExists = personRepository.existsByNameAndOptionalBirthDate(
                    firstName,
                    lastName,
                    data.birthDate()
            );
        } else {
            duplicateExists = personRepository.existsByNameAndOptionalBirthDateExcludingId(
                    currentPersonId,
                    firstName,
                    lastName,
                    data.birthDate()
            );
        }

        if (duplicateExists) {
            throw new DuplicatePersonException(firstName, lastName, data.birthDate());
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    @Transactional
    public void delete(UUID id) {
        Person person = personRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Person wurde nicht gefunden."));

        personRelationRepository.deleteByPersonId(id);

        personRepository.delete(person);
    }
}
