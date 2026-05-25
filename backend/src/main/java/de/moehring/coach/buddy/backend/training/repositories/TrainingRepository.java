package de.moehring.coach.buddy.backend.training.repositories;

import de.moehring.coach.buddy.backend.training.entities.Training;
import de.moehring.coach.buddy.backend.training.search.TrainingSearchCriteria;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class TrainingRepository implements PanacheRepositoryBase<Training, UUID> {

    public List<Training> search(TrainingSearchCriteria criteria) {
        StringBuilder query = new StringBuilder("1 = 1");
        Map<String, Object> params = new HashMap<>();

        if (criteria.getTeamId() != null) {
            query.append(" and team.id = :teamId");
            params.put("teamId", criteria.getTeamId());
        }

        if (criteria.getTrainingDate() != null) {
            query.append(" and trainingDate = :trainingDate");
            params.put("trainingDate", criteria.getTrainingDate());
        }

        if (criteria.getDateFrom() != null) {
            query.append(" and trainingDate >= :dateFrom");
            params.put("dateFrom", criteria.getDateFrom());
        }

        if (criteria.getDateTo() != null) {
            query.append(" and trainingDate <= :dateTo");
            params.put("dateTo", criteria.getDateTo());
        }

        if (criteria.getStatus() != null) {
            query.append(" and status = :status");
            params.put("status", criteria.getStatus());
        }

        query.append(" order by trainingDate desc, startTime desc");

        return find(query.toString(), params).list();
    }
}