package de.moehring.coach.buddy.backend.person.exceptions;

import java.time.LocalDate;

public class DuplicatePersonException extends RuntimeException {

    public DuplicatePersonException(String firstName, String lastName, LocalDate birthDate) {
        super(buildMessage(firstName, lastName, birthDate));
    }

    private static String buildMessage(String firstName, String lastName, LocalDate birthDate) {
        if (birthDate == null) {
            return "Eine Person mit dem Namen " + firstName + " " + lastName + " existiert bereits.";
        }

        return "Eine Person mit dem Namen " + firstName + " " + lastName
                + " und Geburtsdatum " + birthDate + " existiert bereits.";
    }
}
