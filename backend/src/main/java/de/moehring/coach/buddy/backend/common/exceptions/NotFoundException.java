package de.moehring.coach.buddy.backend.common.exceptions;

import jakarta.ws.rs.core.Response;

/**
 * Exception für nicht gefundene Ressourcen.
 * <p>
 * Diese Exception wird verwendet, wenn eine angefragte Entität, zum Beispiel
 * eine Person, Mannschaft, Saison oder Mitgliedschaft, nicht existiert.
 */
public class NotFoundException extends ApiException {

    /**
     * Erstellt eine neue Not-Found-Exception.
     *
     * @param message fachliche Fehlermeldung
     */
    public NotFoundException(String message) {
        super(Response.Status.NOT_FOUND, message);
    }
}