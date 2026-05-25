package de.moehring.coach.buddy.backend.team.dtos;

import java.time.Instant;
import java.util.UUID;

public record TeamDto(
        UUID id,
        UUID seasonId,
        String seasonName,
        String name,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}
