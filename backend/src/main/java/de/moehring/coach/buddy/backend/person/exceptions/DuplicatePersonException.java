package de.moehring.coach.buddy.backend.person.exceptions;

import de.moehring.coach.buddy.backend.common.exceptions.ConflictException;

import java.time.LocalDate;

/**
 * Exception für den Fall, dass eine Person bereits existiert.
 * <p>
 * Eine Person gilt fachlich als Duplikat, wenn bereits eine Person mit gleicher
 * Namenskombination und gleichem Geburtsdatum vorhanden ist. Ist kein
 * Geburtsdatum angegeben, wird nur anhand von Vor- und Nachname geprüft.
 */
public class DuplicatePersonException extends ConflictException {

    /**
     * Erstellt eine neue Duplicate-Person-Exception.
     *
     * @param firstName Vorname der Person
     * @param lastName  Nachname der Person
     * @param birthDate Geburtsdatum der Person, kann {@code null} sein
     */
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