package de.moehring.coach.buddy.backend.team.resources;

import de.moehring.coach.buddy.backend.team.dtos.CreateTeamRequest;
import de.moehring.coach.buddy.backend.team.dtos.TeamDto;
import de.moehring.coach.buddy.backend.team.services.TeamService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@Path("/api/v1/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class TeamResource {

    private final TeamService teamService;

    @GET
    public List<TeamDto> findAllTeams(@QueryParam("seasonId") UUID seasonId) {
        return teamService.findAllTeams(seasonId);
    }

    @GET
    @Path("/{id}")
    public TeamDto findById(@PathParam("id") UUID id) {
        return teamService.findById(id);
    }

    @POST
    public TeamDto createTeam(@Valid CreateTeamRequest request) {
        return teamService.createTeam(request);
    }
}