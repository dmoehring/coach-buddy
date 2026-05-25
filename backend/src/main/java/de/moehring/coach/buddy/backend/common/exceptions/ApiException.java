package de.moehring.coach.buddy.backend.common.exceptions;

import jakarta.ws.rs.core.Response;

/**
 * Basisklasse für fachliche API-Exceptions.
 * <p>
 * Diese Exception verbindet eine fachliche Fehlermeldung mit einem konkreten
 * HTTP-Statuscode. Dadurch können Services aussagekräftige Exceptions werfen,
 * während ein zentraler {@link ApiExceptionMapper} daraus eine einheitliche
 * HTTP-Fehlerantwort erzeugt.
 */
public abstract class ApiException extends RuntimeException {

    private final Response.Status status;

    /**
     * Erstellt eine neue API-Exception mit HTTP-Status und Fehlermeldung.
     *
     * @param status  HTTP-Status, der an den Client zurückgegeben werden soll
     * @param message fachliche Fehlermeldung
     */
    protected ApiException(Response.Status status, String message) {
        super(message);
        this.status = status;
    }

    /**
     * Gibt den HTTP-Status dieser Exception zurück.
     *
     * @return HTTP-Status für die API-Antwort
     */
    public Response.Status getStatus() {
        return status;
    }
}