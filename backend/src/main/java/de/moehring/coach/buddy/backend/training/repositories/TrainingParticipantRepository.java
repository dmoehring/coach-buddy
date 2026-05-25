package de.moehring.coach.buddy.backend.training.repositories;

import de.moehring.coach.buddy.backend.training.entities.TrainingParticipant;
import de.moehring.coach.buddy.backend.training.search.TrainingParticipantSearchCriteria;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class TrainingParticipantRepository implements PanacheRepositoryBase<TrainingParticipant, UUID> {

    public List<TrainingParticipant> search(TrainingParticipantSearchCriteria criteria) {
        StringBuilder query = new StringBuilder("1 = 1");
        Map<String, Object> params = new HashMap<>();

        if (criteria.getTrainingId() != null) {
            query.append(" and training.id = :trainingId");
            params.put("trainingId", criteria.getTrainingId());
        }

        if (criteria.getPersonId() != null) {
            query.append(" and person.id = :personId");
            params.put("personId", criteria.getPersonId());
        }

        if (criteria.getAttendanceStatus() != null) {
            query.append(" and attendanceStatus = :attendanceStatus");
            params.put("attendanceStatus", criteria.getAttendanceStatus());
        }

        return find(query.toString(), params).list();
    }

    public boolean existsByTrainingIdAndPersonId(UUID trainingId, UUID personId) {
        return count(
                "training.id = ?1 and person.id = ?2",
                trainingId,
                personId
        ) > 0;
    }
}