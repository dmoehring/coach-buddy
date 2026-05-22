package de.moehring.coach.buddy.backend.person.model;

import java.time.LocalDate;
import java.util.List;

public record PersonWriteData(
        String firstName,
        String lastName,
        LocalDate birthDate,
        String nickname,
        String notes,
        List<PhoneNumberWriteData> phoneNumbers
) {
}
