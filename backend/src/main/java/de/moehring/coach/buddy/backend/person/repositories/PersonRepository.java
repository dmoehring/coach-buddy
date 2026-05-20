package de.moehring.coach.buddy.backend.person.repositories;

import de.moehring.coach.buddy.backend.person.entities.Person;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class PersonRepository implements PanacheRepositoryBase<Person, UUID> {
}
