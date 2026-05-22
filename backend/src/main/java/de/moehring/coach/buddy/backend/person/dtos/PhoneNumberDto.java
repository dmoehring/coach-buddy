package de.moehring.coach.buddy.backend.person.dtos;

import de.moehring.coach.buddy.backend.person.util.PhoneType;

import java.util.UUID;

public record PhoneNumberDto(
        UUID id,
        PhoneType type,
        String number
) {
}
