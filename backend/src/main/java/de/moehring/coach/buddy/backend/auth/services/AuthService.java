package de.moehring.coach.buddy.backend.auth.services;

import de.moehring.coach.buddy.backend.auth.dtos.LoginRequest;
import de.moehring.coach.buddy.backend.auth.dtos.LoginResponse;
import de.moehring.coach.buddy.backend.auth.entities.Account;
import de.moehring.coach.buddy.backend.auth.repositories.AccountRepository;
import de.moehring.coach.buddy.backend.common.exceptions.UnauthorizedException;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.time.Instant;

@ApplicationScoped
@RequiredArgsConstructor
public class AuthService {

    private static final Duration TOKEN_VALIDITY = Duration.ofHours(24);

    private final AccountRepository accountRepository;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    public LoginResponse login(LoginRequest request) {
        Account account = accountRepository.findByUsername(request.username())
                .orElseThrow(() -> new UnauthorizedException("Benutzername oder Passwort ist falsch."));

        if (!BcryptUtil.matches(request.password(), account.getPasswordHash())) {
            throw new UnauthorizedException("Benutzername oder Passwort ist falsch.");
        }

        Instant expiresAt = Instant.now().plus(TOKEN_VALIDITY);

        String token = Jwt.issuer(issuer)
                .upn(account.getUsername())
                .groups("coach")
                .claim("displayName", account.getDisplayName())
                .expiresAt(expiresAt)
                .sign();

        return new LoginResponse(token, expiresAt, account.getDisplayName(), account.getUsername());
    }
}
