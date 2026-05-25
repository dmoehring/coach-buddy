package de.moehring.coach.buddy.backend.team.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamRequest;
import de.moehring.coach.buddy.backend.team.dtos.TeamDto;
import de.moehring.coach.buddy.backend.team.services.TeamService;
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
import java.util.UUID;

@Path("/api/v1/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Verwaltung von Mannschaften innerhalb einer Saison")
public class TeamResource {

    private final TeamService teamService;

    @GET
    @Operation(summary = "Find teams", description = "Returns all teams, optionally filtered by season id.")
    @APIResponse(
            responseCode = "200",
            description = "Teams found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    array = @ArraySchema(schema = @Schema(implementation = TeamDto.class))
            )
    )
    public List<TeamDto> findAllTeams(@QueryParam("seasonId") UUID seasonId) {
        return teamService.findAllTeams(seasonId);
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Find team by id", description = "Returns a single team by id.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "200",
                    description = "Team found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = TeamDto.class)
                    )
            ),
            @APIResponse(
                    responseCode = "404",
                    description = "Team not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public TeamDto findById(@PathParam("id") UUID id) {
        return teamService.findById(id);
    }

    @POST
    @Operation(summary = "Create team", description = "Creates a new team for a season.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "201",
                    description = "Team created",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = TeamDto.class)
                    )
            ),
            @APIResponse(
                    responseCode = "400",
                    description = "Invalid request",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "404",
                    description = "Season not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "409",
                    description = "Team already exists in season",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response createTeam(@Valid CreateTeamRequest request, @Context UriInfo uriInfo) {
        TeamDto team = teamService.createTeam(request);
        return Response
                .created(uriInfo.getAbsolutePathBuilder().path(team.id().toString()).build())
                .entity(team)
                .build();
    }
}
