package de.moehring.coach.buddy.backend.team.repositories;

import de.moehring.coach.buddy.backend.team.entities.Team;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@ApplicationScoped
public class TeamRepository implements PanacheRepositoryBase<Team, UUID> {

    public List<Team> findBySeasonId(UUID seasonId) {
        return list("season.id = ?1", seasonId);
    }

    public boolean existsBySeasonAndName(UUID seasonId, String name) {
        String normalizedName = name.trim().toLowerCase(Locale.ROOT);

        return count(
                "season.id = ?1 and lower(trim(name)) = ?2",
                seasonId,
                normalizedName
        ) > 0;
    }
}