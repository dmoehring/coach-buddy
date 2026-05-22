package de.moehring.coach.buddy.backend.person.resources;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRelationRequest;
import de.moehring.coach.buddy.backend.person.dtos.PersonRelationDto;
import de.moehring.coach.buddy.backend.person.services.PersonRelationService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

@Path("/api/v1/person-relations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class PersonRelationResource {

    private final PersonRelationService personRelationService;

    @POST
    public PersonRelationDto createRelation(@Valid CreatePersonRelationRequest request) {
        return personRelationService.create(request);
    }
}