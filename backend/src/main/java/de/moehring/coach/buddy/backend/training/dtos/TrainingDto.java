package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.team.dtos.TeamDto;
import de.moehring.coach.buddy.backend.training.util.TrainingStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record TrainingDto(
        UUID id,
        TeamDto team,
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