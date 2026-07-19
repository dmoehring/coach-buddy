package de.moehring.coach.buddy.backend.auth.repositories;

import de.moehring.coach.buddy.backend.auth.entities.Account;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class AccountRepository implements PanacheRepositoryBase<Account, UUID> {

    public Optional<Account> findByUsername(String username) {
        return find("lower(username) = ?1", username.trim().toLowerCase()).firstResultOptional();
    }
}
