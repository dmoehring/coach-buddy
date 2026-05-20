package de.moehring.coach.buddy.backend.person.dtos;

import de.moehring.coach.buddy.backend.person.entities.PhoneNumber;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PersonDto(
        String firstName,
        String lastName,
        LocalDate birthDate,
        String nickname,
        String notes,
        List<PhoneNumberDto> phoneNumbers,
        Instant createdAt,
        Instant updatedAt
) {
}
