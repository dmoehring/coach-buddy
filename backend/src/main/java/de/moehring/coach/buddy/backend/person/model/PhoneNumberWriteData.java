package de.moehring.coach.buddy.backend.person.model;

import de.moehring.coach.buddy.backend.person.util.PhoneType;

public record PhoneNumberWriteData(
        PhoneType type,
        String number
) {
}