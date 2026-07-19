package de.moehring.coach.buddy.backend.auth.dtos;

import java.time.Instant;

public record LoginResponse(
        String token,
        Instant expiresAt,
        String displayName,
        String username
) {
}
