package de.moehring.coach.buddy.backend.person.dtos;

import de.moehring.coach.buddy.backend.person.util.PhoneType;
import io.smallrye.common.constraint.NotNull;
import jakarta.validation.constraints.NotBlank;

public record UpdatePhoneNumberRequest(
        @NotNull PhoneType type,
        @NotBlank String number
) {
}
