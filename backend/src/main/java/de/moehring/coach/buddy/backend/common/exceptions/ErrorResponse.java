package de.moehring.coach.buddy.backend.common.exceptions;

import java.time.Instant;

/**
 * Einheitliche Fehlerantwort der REST-API.
 * <p>
 * Diese Klasse beschreibt die JSON-Struktur, die bei fachlichen API-Fehlern
 * an den Client zurückgegeben wird.
 *
 * @param status    numerischer HTTP-Statuscode
 * @param error     textuelle Beschreibung des HTTP-Status
 * @param message   fachliche Fehlermeldung
 * @param timestamp Zeitpunkt der Fehlererzeugung
 */
public record ErrorResponse(
        int status,
        String error,
        String message,
        Instant timestamp
) {
}