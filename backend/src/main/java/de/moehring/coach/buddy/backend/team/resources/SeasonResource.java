package de.moehring.coach.buddy.backend.team.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.team.dtos.CreateSeasonRequest;
import de.moehring.coach.buddy.backend.team.dtos.SeasonDto;
import de.moehring.coach.buddy.backend.team.services.SeasonService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.ArraySchema;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/v1/seasons")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Seasons", description = "Verwaltung von Saisons")
public class SeasonResource {

    private final SeasonService seasonService;

    @GET
    @Operation(summary = "Find seasons", description = "Returns all seasons.")
    @APIResponse(
            responseCode = "200",
            description = "Seasons found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    array = @ArraySchema(schema = @Schema(implementation = SeasonDto.class))
            )
    )
    public List<SeasonDto> findAllSeasons() {
        return seasonService.findAllSeasons();
    }

    @POST
    @Operation(summary = "Create season", description = "Creates a new open season and closes the previous open season if present.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "201",
                    description = "Season created",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = SeasonDto.class)
                    )
            ),
            @APIResponse(
                    responseCode = "400",
                    description = "Invalid season date",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "409",
                    description = "Season already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response createSeason(@Valid CreateSeasonRequest createSeasonRequest, @Context UriInfo uriInfo) {
        SeasonDto season = seasonService.createSeason(createSeasonRequest);
        return Response
                .created(uriInfo.getAbsolutePathBuilder().path(season.id().toString()).build())
                .entity(season)
                .build();
    }
}
