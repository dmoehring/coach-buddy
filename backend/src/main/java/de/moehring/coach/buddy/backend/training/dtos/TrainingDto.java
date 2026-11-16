package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.team.dtos.TeamDto;
import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingType;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record TrainingDto(
        UUID id,
        TeamDto team,
        TrainingType type,
        String title,
        LocalDate trainingDate,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        String notes,
        TrainingStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
