package de.moehring.coach.buddy.backend.training.dtos;

import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;

import java.time.Instant;
import java.util.UUID;

public record TrainingParticipantDto(
        UUID id,
        TrainingDto training,
        PersonDto person,
        AttendanceStatus attendanceStatus,
        Integer jerseyNumber,
        Integer minutesPlayed,
        Integer minutesInGoal,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
