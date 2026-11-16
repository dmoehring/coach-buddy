package de.moehring.coach.buddy.backend.export.util;

import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.person.entities.PhoneNumber;
import de.moehring.coach.buddy.backend.person.util.PhoneType;
import de.moehring.coach.buddy.backend.person.util.RelationType;
import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;
import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * German labels and formatting shared by all CSV exports.
 */
public final class ExportFormat {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private ExportFormat() {
    }

    public static String date(LocalDate date) {
        return date == null ? "" : DATE.format(date);
    }

    public static String time(LocalTime time) {
        return time == null ? "" : TIME.format(time);
    }

    public static String role(TeamMemberRole role) {
        return switch (role) {
            case PLAYER -> "Spieler";
            case COACH -> "Trainer";
            case ASSISTANT_COACH -> "Co-Trainer";
        };
    }

    public static String attendance(AttendanceStatus status) {
        return switch (status) {
            case PRESENT -> "Anwesend";
            case EXCUSED -> "Entschuldigt";
            case ABSENT -> "Unentschuldigt";
        };
    }

    public static String relation(RelationType type) {
        return switch (type) {
            case MOTHER -> "Mutter";
            case FATHER -> "Vater";
            case GRANDMOTHER -> "Oma";
            case GRANDFATHER -> "Opa";
            case STEP_PARENT -> "Stiefelternteil";
            case OTHER -> "Sonstige";
        };
    }

    public static String phoneType(PhoneType type) {
        return switch (type) {
            case MOBILE -> "mobil";
            case HOME -> "privat";
            case WORK -> "dienstlich";
            case EMERGENCY -> "Notfall";
        };
    }

    public static String fullName(Person person) {
        return person.getFirstName() + " " + person.getLastName();
    }

    public static String phoneNumbers(List<PhoneNumber> numbers) {
        return numbers.stream()
                .map(number -> number.getNumber() + " (" + phoneType(number.getType()) + ")")
                .collect(Collectors.joining(", "));
    }

    /**
     * ASCII-only, filesystem-safe file name part, e.g. "Spielfest Müller" -> "spielfest-mueller".
     */
    public static String slug(String value) {
        String replaced = value
                .replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
                .replace("Ä", "Ae").replace("Ö", "Oe").replace("Ü", "Ue")
                .replace("ß", "ss");
        String ascii = Normalizer.normalize(replaced, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .toLowerCase(Locale.ROOT);
        return ascii.isEmpty() ? "export" : ascii;
    }
}
