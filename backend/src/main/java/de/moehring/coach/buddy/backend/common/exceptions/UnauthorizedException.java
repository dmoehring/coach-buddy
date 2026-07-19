package de.moehring.coach.buddy.backend.common.exceptions;

import jakarta.ws.rs.core.Response;

/**
 * Exception für fehlgeschlagene Anmeldeversuche.
 */
public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(Response.Status.UNAUTHORIZED, message);
    }
}
