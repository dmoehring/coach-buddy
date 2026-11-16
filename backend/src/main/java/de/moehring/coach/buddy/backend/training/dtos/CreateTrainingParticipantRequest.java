package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateTrainingParticipantRequest(
        @NotNull UUID trainingId,
        @NotNull UUID personId,
        @NotNull AttendanceStatus attendanceStatus,
        @Min(0) @Max(999) Integer jerseyNumber,
        @Min(0) @Max(999) Integer minutesPlayed,
        @Min(0) @Max(999) Integer minutesInGoal,
        String notes
) {
}
