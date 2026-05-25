package de.moehring.coach.buddy.backend.person.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record CreatePersonRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        LocalDate birthDate,
        String nickname,
        String notes,
        List<@Valid CreatePhoneNumberRequest> phoneNumbers
) {
}
