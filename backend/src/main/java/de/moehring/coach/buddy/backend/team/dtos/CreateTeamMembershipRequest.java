package de.moehring.coach.buddy.backend.team.dtos;

import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateTeamMembershipRequest(
        @NotNull UUID teamId,
        @NotNull UUID personId,
        @NotNull TeamMemberRole role,
        LocalDate joinedAt,
        LocalDate leftAt
) {
}
