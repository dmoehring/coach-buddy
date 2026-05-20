package de.moehring.coach.buddy.backend.person.dtos;

import de.moehring.coach.buddy.backend.person.util.PhoneType;

public record PhoneNumberDto(
        PhoneType type,
        String number
) {
}
