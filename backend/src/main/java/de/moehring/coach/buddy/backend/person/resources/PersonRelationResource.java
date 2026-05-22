package de.moehring.coach.buddy.backend.person.resources;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRelationRequest;
import de.moehring.coach.buddy.backend.person.dtos.PersonRelationDto;
import de.moehring.coach.buddy.backend.person.services.PersonRelationService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

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

    @GET
    @Path("/{id}")
    public PersonRelationDto findById(@PathParam("id") UUID id) {
        return personRelationService.findById(id);
    }

    @DELETE
    @Path("/{id}")
    public Response deleteRelation(@PathParam("id") UUID id) {
        personRelationService.delete(id);
        return Response.noContent().build();
    }
}