package de.moehring.coach.buddy.backend.team.resources;

import de.moehring.coach.buddy.backend.team.dtos.CreateSeasonRequest;
import de.moehring.coach.buddy.backend.team.dtos.SeasonDto;
import de.moehring.coach.buddy.backend.team.services.SeasonService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Path("/api/v1/seasons")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class SeasonResource {

    private final SeasonService seasonService;

    @GET
    public List<SeasonDto> findAllSeasons() {
        return seasonService.findAllSeasons();
    }

    @POST
    public SeasonDto createSeason(@Valid CreateSeasonRequest createSeasonRequest) {
        return seasonService.createSeason(createSeasonRequest);
    }
}
