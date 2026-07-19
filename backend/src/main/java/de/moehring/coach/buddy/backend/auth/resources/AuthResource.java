package de.moehring.coach.buddy.backend.auth.resources;

import de.moehring.coach.buddy.backend.auth.dtos.LoginRequest;
import de.moehring.coach.buddy.backend.auth.dtos.LoginResponse;
import de.moehring.coach.buddy.backend.auth.services.AuthService;
import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/v1/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Anmeldung am System")
public class AuthResource {

    private final AuthService authService;

    @POST
    @Path("/login")
    @Operation(summary = "Login", description = "Meldet einen Account per Benutzername und Passwort an und liefert ein JWT.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "200",
                    description = "Anmeldung erfolgreich",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = LoginResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "401",
                    description = "Benutzername oder Passwort ist falsch",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public LoginResponse login(@Valid LoginRequest loginRequest) {
        return authService.login(loginRequest);
    }
}
