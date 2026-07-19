package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTrainingParticipantRequest(
        @NotNull AttendanceStatus attendanceStatus,
        String notes
) {
}
