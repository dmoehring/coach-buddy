package de.moehring.coach.buddy.backend.common.exceptions;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.time.Instant;

/**
 * Zentraler Mapper für fachliche API-Exceptions.
 * <p>
 * Diese Klasse wandelt alle {@link ApiException}-Instanzen in eine einheitliche
 * HTTP-Fehlerantwort um. Dadurch müssen Services nur fachliche Exceptions
 * werfen und keine HTTP-Antworten selbst erzeugen.
 */
@Provider
public class ApiExceptionMapper implements ExceptionMapper<ApiException> {

    /**
     * Wandelt eine {@link ApiException} in eine HTTP-Response um.
     *
     * @param exception aufgetretene API-Exception
     * @return HTTP-Response mit passendem Statuscode und strukturierter Fehlerantwort
     */
    @Override
    public Response toResponse(ApiException exception) {
        Response.Status status = exception.getStatus();

        ErrorResponse errorResponse = new ErrorResponse(
                status.getStatusCode(),
                status.getReasonPhrase(),
                exception.getMessage(),
                Instant.now()
        );

        return Response
                .status(status)
                .entity(errorResponse)
                .build();
    }
}