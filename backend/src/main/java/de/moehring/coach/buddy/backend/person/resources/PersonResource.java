package de.moehring.coach.buddy.backend.person.resources;

import de.moehring.coach.buddy.backend.person.dtos.ChildDto;
import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.person.dtos.UpdatePersonRequest;
import de.moehring.coach.buddy.backend.person.search.PersonSearchCriteria;
import de.moehring.coach.buddy.backend.person.services.PersonService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@Path("/api/v1/persons")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class PersonResource {

    private final PersonService personService;

    @GET
    public List<PersonDto> findAllPersons(@BeanParam PersonSearchCriteria personSearchCriteria) {
        return personService.findAll(personSearchCriteria);
    }

    @POST
    public PersonDto createPerson(@Valid CreatePersonRequest createPersonRequest) {
        return personService.create(createPersonRequest);
    }

    @GET
    @Path("/{id}")
    public PersonDto findById(@PathParam("id") UUID id) {
        return personService.findById(id);
    }

    @PUT
    @Path("/{id}")
    public PersonDto updatePerson(
            @PathParam("id") UUID id,
            @Valid UpdatePersonRequest updatePersonRequest) {
        return personService.update(id, updatePersonRequest);
    }

    @DELETE
    @Path("/{id}")
    public Response deletePerson(@PathParam("id") UUID id) {
        personService.delete(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/children")
    public List<ChildDto> findAllChildren() {
        return personService.findAllChildren();
    }

}
