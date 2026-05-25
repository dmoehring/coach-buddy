package de.moehring.coach.buddy.backend.common.exceptions;

import jakarta.ws.rs.core.Response;

/**
 * Exception für fachlich oder syntaktisch ungültige Anfragen.
 * <p>
 * Diese Exception wird verwendet, wenn die Anfrage des Clients nicht verarbeitet
 * werden kann, weil einzelne Werte ungültig sind oder fachliche Regeln verletzt
 * werden.
 */
public class BadRequestException extends ApiException {

    /**
     * Erstellt eine neue Bad-Request-Exception.
     *
     * @param message fachliche Fehlermeldung
     */
    public BadRequestException(String message) {
        super(Response.Status.BAD_REQUEST, message);
    }
}