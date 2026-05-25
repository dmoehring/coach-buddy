package de.moehring.coach.buddy.backend.person.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.person.dtos.ChildDto;
import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.person.dtos.PersonDto;
import de.moehring.coach.buddy.backend.person.dtos.UpdatePersonRequest;
import de.moehring.coach.buddy.backend.person.search.PersonSearchCriteria;
import de.moehring.coach.buddy.backend.person.services.PersonService;
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

@Path("/api/v1/persons")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Persons", description = "Verwaltung von Personen")
public class PersonResource {

    private final PersonService personService;

    @GET
    @Operation(summary = "Find persons", description = "Returns all persons matching the optional search criteria.")
    @APIResponse(
            responseCode = "200",
            description = "Persons found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(type = SchemaType.ARRAY, implementation = PersonDto.class)
            )
    )
    public List<PersonDto> findAllPersons(@BeanParam PersonSearchCriteria personSearchCriteria) {
        return personService.findAll(personSearchCriteria);
    }

    @POST
    @Operation(summary = "Create person", description = "Creates a new person.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "201",
                    description = "Person created",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = PersonDto.class)
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
                    responseCode = "409",
                    description = "Person already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response createPerson(@Valid CreatePersonRequest createPersonRequest, @Context UriInfo uriInfo) {
        PersonDto person = personService.create(createPersonRequest);
        return Response
                .created(uriInfo.getAbsolutePathBuilder().path(person.id().toString()).build())
                .entity(person)
                .build();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Find person by id", description = "Returns a single person by id.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "200",
                    description = "Person found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = PersonDto.class)
                    )
            ),
            @APIResponse(
                    responseCode = "404",
                    description = "Person not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public PersonDto findById(@PathParam("id") UUID id) {
        return personService.findById(id);
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update person", description = "Updates an existing person.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "200",
                    description = "Person updated",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = PersonDto.class)
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
                    description = "Person not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "409",
                    description = "Person already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public PersonDto updatePerson(
            @PathParam("id") UUID id,
            @Valid UpdatePersonRequest updatePersonRequest) {
        return personService.update(id, updatePersonRequest);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete person", description = "Deletes a person and dependent person relations.")
    @APIResponses(value = {
            @APIResponse(responseCode = "204", description = "Person deleted"),
            @APIResponse(
                    responseCode = "404",
                    description = "Person not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response deletePerson(@PathParam("id") UUID id) {
        personService.delete(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/children")
    @Operation(summary = "Find children", description = "Returns persons interpreted as children with their guardians.")
    @APIResponse(
            responseCode = "200",
            description = "Children found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(type = SchemaType.ARRAY, implementation = ChildDto.class)
            )
    )
    public List<ChildDto> findAllChildren() {
        return personService.findAllChildren();
    }
}
