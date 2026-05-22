package de.moehring.coach.buddy.backend.person.repositories;

import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PersonRelationRepository implements PanacheRepositoryBase<PersonRelation, UUID> {

    public boolean existsByChildAndGuardian(UUID childPersonId, UUID guardianPersonId) {
        return count(
                "childPerson.id = ?1 and guardianPerson.id = ?2",
                childPersonId,
                guardianPersonId
        ) > 0;
    }

    public List<PersonRelation> findByChildPersonId(UUID childPersonId) {
        return list("childPerson.id = ?1", childPersonId);
    }

    public List<PersonRelation> findByGuardianPersonId(UUID guardianPersonId) {
        return list("guardianPerson.id = ?1", guardianPersonId);
    }
}