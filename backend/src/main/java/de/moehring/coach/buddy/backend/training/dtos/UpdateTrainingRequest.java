package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateTrainingRequest(
        TrainingType type,
        String title,
        @NotNull LocalDate trainingDate,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        String notes,
        @NotNull TrainingStatus status
) {
}
