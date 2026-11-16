package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateTrainingRequest(
        @NotNull LocalDate trainingDate,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        String notes,
        @NotNull TrainingStatus status
) {
}
