package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateTrainingRequest(
        @NotNull UUID teamId,
        @NotNull LocalDate trainingDate,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        String notes,
        TrainingStatus status
) {
}