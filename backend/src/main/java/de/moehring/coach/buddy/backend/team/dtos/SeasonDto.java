package de.moehring.coach.buddy.backend.team.dtos;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SeasonDto(
        UUID id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        Instant createdAt,
        Instant updatedAt
) {
}
