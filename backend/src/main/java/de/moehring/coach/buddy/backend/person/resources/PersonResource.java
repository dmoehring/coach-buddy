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

import java.util.List;
import java.util.UUID;

@Path("/api/v1/persons")
public class PersonResource {

    private final PersonService personService;

    public PersonResource(PersonService personService) {
        this.personService = personService;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<PersonDto> findAllPersons(@BeanParam PersonSearchCriteria personSearchCriteria) {
        return personService.findAll(personSearchCriteria);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PersonDto createPerson(@Valid CreatePersonRequest createPersonRequest) {
        return personService.create(createPersonRequest);
    }

    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public PersonDto findById(@PathParam("id") UUID id) {
        return personService.findById(id);
    }

    @PUT
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
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
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/children")
    public List<ChildDto> findAllChildren() {
        return personService.findAllChildren();
    }

}
