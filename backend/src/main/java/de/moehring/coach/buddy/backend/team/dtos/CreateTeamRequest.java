package de.moehring.coach.buddy.backend.team.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateTeamRequest(
        @NotNull UUID seasonId,
        @NotBlank String name,
        String description
) {
}
