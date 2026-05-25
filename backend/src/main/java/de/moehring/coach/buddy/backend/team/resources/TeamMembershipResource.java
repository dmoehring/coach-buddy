package de.moehring.coach.buddy.backend.team.resources;

import de.moehring.coach.buddy.backend.team.dtos.CreateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.dtos.TeamMembershipDto;
import de.moehring.coach.buddy.backend.team.search.DeactivateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.search.TeamMembershipSearchCriteria;
import de.moehring.coach.buddy.backend.team.services.TeamMembershipService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Path("/api/v1/team-memberships")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class TeamMembershipResource {

    private final TeamMembershipService teamMembershipService;

    @GET
    public List<TeamMembershipDto> findAllTeamMemberships(@BeanParam TeamMembershipSearchCriteria teamMembershipSearchCriteria) {
        return teamMembershipService.findAll(teamMembershipSearchCriteria);
    }

    @POST
    public TeamMembershipDto createTeamMembership(CreateTeamMembershipRequest createTeamMembershipRequest) {
        return teamMembershipService.createTeamMembership(createTeamMembershipRequest);
    }

    @PATCH
    @Path("/{id}/deactivate")
    public TeamMembershipDto deactivateTeamMembership(
            @PathParam("id") UUID id,
            DeactivateTeamMembershipRequest request
    ) {
        return teamMembershipService.deactivate(id, request);
    }
}
