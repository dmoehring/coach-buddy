package de.moehring.coach.buddy.backend.person.repositories;

import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.person.search.PersonSearchCriteria;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class PersonRepository implements PanacheRepositoryBase<Person, UUID> {
    public List<Person> search(PersonSearchCriteria criteria) {
        StringBuilder query = new StringBuilder("1 = 1");
        Map<String, Object> params = new HashMap<>();

        if (criteria.getBirthYear() != null) {
            LocalDate start = LocalDate.of(criteria.getBirthYear(), 1, 1);
            LocalDate end = start.plusYears(1);

            query.append(" and birthDate >= :birthYearStart");
            query.append(" and birthDate < :birthYearEnd");

            params.put("birthYearStart", start);
            params.put("birthYearEnd", end);
        }

        if (criteria.getBirthMonth() != null) {
            query.append(" and month(birthDate) = :birthMonth");
            params.put("birthMonth", criteria.getBirthMonth());
        }

        if (criteria.getFirstName() != null && !criteria.getFirstName().isBlank()) {
            query.append(" and lower(firstName) like :firstName");
            params.put("firstName", "%" + criteria.getFirstName().trim().toLowerCase() + "%");
        }

        if (criteria.getLastName() != null && !criteria.getLastName().isBlank()) {
            query.append(" and lower(lastName) like :lastName");
            params.put("lastName", "%" + criteria.getLastName().trim().toLowerCase() + "%");
        }

        return find(query.toString(), params).list();
    }

    public boolean existsByNameAndOptionalBirthDate(String firstName, String lastName, LocalDate birthDate) {
        String normalizedFirstName = firstName.trim().toLowerCase();
        String normalizedLastName = lastName.trim().toLowerCase();

        if (birthDate == null) {
            return count("""
                            lower(trim(firstName)) = ?1
                            and lower(trim(lastName)) = ?2
                            and birthDate is null
                            """,
                    normalizedFirstName,
                    normalizedLastName
            ) > 0;
        }

        return count("""
                        lower(trim(firstName)) = ?1
                        and lower(trim(lastName)) = ?2
                        and birthDate = ?3
                        """,
                normalizedFirstName,
                normalizedLastName,
                birthDate
        ) > 0;
    }
}
