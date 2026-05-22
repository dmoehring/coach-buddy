package de.moehring.coach.buddy.backend.person.services;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRelationRequest;
import de.moehring.coach.buddy.backend.person.dtos.PersonRelationDto;
import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import de.moehring.coach.buddy.backend.person.exceptions.BadRequestException;
import de.moehring.coach.buddy.backend.person.mappers.PersonRelationMapper;
import de.moehring.coach.buddy.backend.person.repositories.PersonRelationRepository;
import de.moehring.coach.buddy.backend.person.repositories.PersonRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class PersonRelationService {

    private final PersonRepository personRepository;
    private final PersonRelationRepository personRelationRepository;
    private final PersonRelationMapper personRelationMapper;

    @Transactional
    public PersonRelationDto create(CreatePersonRelationRequest request) {
        if (request.childPersonId().equals(request.guardianPersonId())) {
            throw new BadRequestException("Kind und Kontaktperson dürfen nicht identisch sein.");
        }

        Person childPerson = personRepository.findByIdOptional(request.childPersonId())
                .orElseThrow(() -> new NotFoundException("Kind-Person wurde nicht gefunden."));

        Person guardianPerson = personRepository.findByIdOptional(request.guardianPersonId())
                .orElseThrow(() -> new NotFoundException("Kontaktperson wurde nicht gefunden."));

        if (personRelationRepository.existsByChildAndGuardian(
                request.childPersonId(),
                request.guardianPersonId()
        )) {
            throw new BadRequestException("Diese Beziehung existiert bereits.");
        }

        PersonRelation relation = new PersonRelation();
        relation.setChildPerson(childPerson);
        relation.setGuardianPerson(guardianPerson);
        relation.setRelationType(request.relationType());

        personRelationRepository.persist(relation);

        return personRelationMapper.mapToDto(relation);
    }

    public PersonRelationDto findById(UUID id) {
        return personRelationMapper.mapToDto(personRelationRepository.findByIdOptional(id).orElseThrow(() -> new NotFoundException("Relation wurde nicht gefunden.")));
    }

    @Transactional
    public void delete(UUID id) {
        PersonRelation relation = personRelationRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Personenbeziehung wurde nicht gefunden."));

        personRelationRepository.delete(relation);
    }

}
