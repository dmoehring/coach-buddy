package de.moehring.coach.buddy.backend.person.repositories;

import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class PersonRelationRepository implements PanacheRepositoryBase<PersonRelation, UUID> {
}
