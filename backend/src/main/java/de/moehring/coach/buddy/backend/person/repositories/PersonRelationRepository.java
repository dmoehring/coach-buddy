package de.moehring.coach.buddy.backend.person.repositories;

import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import de.moehring.coach.buddy.backend.person.search.PersonRelationSearchCriteria;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class PersonRelationRepository implements PanacheRepositoryBase<PersonRelation, UUID> {

    public List<PersonRelation> search(PersonRelationSearchCriteria criteria) {
        StringBuilder query = new StringBuilder("1 = 1");
        Map<String, Object> params = new HashMap<>();

        if (criteria.getChildPersonId() != null) {
            query.append(" and childPerson.id = :childPersonId");
            params.put("childPersonId", criteria.getChildPersonId());
        }

        if (criteria.getGuardianPersonId() != null) {
            query.append(" and guardianPerson.id = :guardianPersonId");
            params.put("guardianPersonId", criteria.getGuardianPersonId());
        }

        return find(query.toString(), params).list();
    }

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

    public long deleteByPersonId(UUID personId) {
        return delete(
                "childPerson.id = ?1 or guardianPerson.id = ?1",
                personId
        );
    }
}