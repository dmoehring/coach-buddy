package de.moehring.coach.buddy.backend.common.exceptions;

import jakarta.ws.rs.core.Response;

/**
 * Exception für fachliche Konflikte mit dem aktuellen Datenbestand.
 * <p>
 * Diese Exception wird verwendet, wenn eine Anfrage formal korrekt ist, aber
 * nicht ausgeführt werden kann, weil sie mit bestehenden Daten kollidiert.
 * Typische Beispiele sind doppelte Personen, doppelte Mannschaftsnamen
 * innerhalb einer Saison oder bereits bestehende Mitgliedschaften.
 */
public class ConflictException extends ApiException {

    /**
     * Erstellt eine neue Conflict-Exception.
     *
     * @param message fachliche Fehlermeldung
     */
    public ConflictException(String message) {
        super(Response.Status.CONFLICT, message);
    }
}