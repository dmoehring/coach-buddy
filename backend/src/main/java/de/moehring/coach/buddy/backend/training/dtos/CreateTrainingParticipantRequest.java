package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateTrainingParticipantRequest(
        @NotNull UUID trainingId,
        @NotNull UUID personId,
        @NotNull AttendanceStatus attendanceStatus,
        String notes
) {
}