package de.moehring.coach.buddy.backend.team.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.dtos.DeactivateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.dtos.TeamMembershipDto;
import de.moehring.coach.buddy.backend.team.search.TeamMembershipSearchCriteria;
import de.moehring.coach.buddy.backend.team.services.TeamMembershipService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Path("/api/v1/team-memberships")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Team Memberships", description = "Verwaltung von Mannschaftsmitgliedschaften")
public class TeamMembershipResource {

    private final TeamMembershipService teamMembershipService;

    @GET
    @Operation(summary = "Find team memberships", description = "Returns team memberships matching the optional search criteria.")
    @APIResponse(
            responseCode = "200",
            description = "Team memberships found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(type = SchemaType.ARRAY, implementation = TeamMembershipDto.class)
            )
    )
    public List<TeamMembershipDto> findAllTeamMemberships(@BeanParam TeamMembershipSearchCriteria teamMembershipSearchCriteria) {
        return teamMembershipService.findAll(teamMembershipSearchCriteria);
    }

    @POST
    @Operation(summary = "Create team membership", description = "Adds a person to a team with a role.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "201",
                    description = "Team membership created",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = TeamMembershipDto.class)
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
                    description = "Referenced person or team not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "409",
                    description = "Team membership already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response createTeamMembership(@Valid CreateTeamMembershipRequest createTeamMembershipRequest, @Context UriInfo uriInfo) {
        TeamMembershipDto membership = teamMembershipService.createTeamMembership(createTeamMembershipRequest);
        return Response
                .created(uriInfo.getAbsolutePathBuilder().path(membership.id().toString()).build())
                .entity(membership)
                .build();
    }

    @PATCH
    @Path("/{id}/deactivate")
    @Operation(summary = "Deactivate team membership", description = "Sets the left date of a team membership.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "200",
                    description = "Team membership deactivated",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = TeamMembershipDto.class)
                    )
            ),
            @APIResponse(
                    responseCode = "400",
                    description = "Invalid left date",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "404",
                    description = "Team membership not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public TeamMembershipDto deactivateTeamMembership(
            @PathParam("id") UUID id,
            DeactivateTeamMembershipRequest request
    ) {
        return teamMembershipService.deactivate(id, request);
    }
}
