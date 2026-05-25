package de.moehring.coach.buddy.backend.team.repositories;

import de.moehring.coach.buddy.backend.team.entities.Season;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class SeasonRepository implements PanacheRepositoryBase<Season, UUID> {
    public boolean existsByName(String name) {
        String normalizedName = name.trim().toLowerCase();

        return count(
                "lower(trim(name)) = ?1",
                normalizedName
        ) > 0;
    }

    public Optional<Season> findOpenSeason() {
        return find("endDate is null").firstResultOptional();
    }

    public long closeOpenSeason(LocalDate endDate) {
        return update("endDate = ?1 where endDate is null", endDate);
    }

}
