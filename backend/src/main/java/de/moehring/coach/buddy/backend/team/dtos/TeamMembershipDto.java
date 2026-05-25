package de.moehring.coach.buddy.backend.team.dtos;

import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TeamMembershipDto(
        UUID id,
        TeamDto team,
        PersonDto person,
        TeamMemberRole role,
        LocalDate joinedAt,
        LocalDate leftAt,
        Instant createdAt,
        Instant updatedAt
) {
}