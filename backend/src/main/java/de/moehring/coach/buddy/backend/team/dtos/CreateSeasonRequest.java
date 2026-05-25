package de.moehring.coach.buddy.backend.team.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateSeasonRequest(
        @NotBlank String name,
        @NotNull LocalDate startDate
) {
}
