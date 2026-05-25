package de.moehring.coach.buddy.backend.team.repositories;

import de.moehring.coach.buddy.backend.team.entities.TeamMembership;
import de.moehring.coach.buddy.backend.team.search.TeamMembershipSearchCriteria;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class TeamMembershipRepository implements PanacheRepositoryBase<TeamMembership, UUID> {

    public List<TeamMembership> search(TeamMembershipSearchCriteria criteria) {
        StringBuilder query = new StringBuilder("1 = 1");
        Map<String, Object> params = new HashMap<>();

        if (criteria.getTeamId() != null) {
            query.append(" and team.id = :teamId");
            params.put("teamId", criteria.getTeamId());
        }

        if (criteria.getPersonId() != null) {
            query.append(" and person.id = :personId");
            params.put("personId", criteria.getPersonId());
        }

        if (criteria.getRole() != null) {
            query.append(" and role = :role");
            params.put("role", criteria.getRole());
        }

        if (criteria.getActive() != null) {
            if (criteria.getActive()) {
                query.append(" and leftAt is null");
            } else {
                query.append(" and leftAt is not null");
            }
        }

        return find(query.toString(), params).list();
    }

    public boolean existsByTeamIdAndPersonId(UUID teamId, UUID personId) {
        return count(
                "team.id = ?1 and person.id = ?2",
                teamId,
                personId
        ) > 0;
    }
}