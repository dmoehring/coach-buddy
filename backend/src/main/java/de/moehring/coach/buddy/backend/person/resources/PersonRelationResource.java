package de.moehring.coach.buddy.backend.person.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRelationRequest;
import de.moehring.coach.buddy.backend.person.dtos.PersonRelationDto;
import de.moehring.coach.buddy.backend.person.search.PersonRelationSearchCriteria;
import de.moehring.coach.buddy.backend.person.services.PersonRelationService;
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

@Path("/api/v1/person-relations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Person Relations", description = "Verwaltung von Beziehungen zwischen Personen")
public class PersonRelationResource {

    private final PersonRelationService personRelationService;

    @GET
    @Operation(summary = "Find person relations", description = "Returns person relations matching the optional search criteria.")
    @APIResponse(
            responseCode = "200",
            description = "Person relations found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(type = SchemaType.ARRAY, implementation = PersonRelationDto.class)
            )
    )
    public List<PersonRelationDto> findAllPersonRelations(@BeanParam PersonRelationSearchCriteria personRelationSearchCriteria) {
        return personRelationService.findAll(personRelationSearchCriteria);
    }

    @POST
    @Operation(summary = "Create person relation", description = "Creates a relation between a child person and a guardian person.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "201",
                    description = "Person relation created",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = PersonRelationDto.class)
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
                    description = "Referenced person not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "409",
                    description = "Person relation already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response createRelation(@Valid CreatePersonRelationRequest request, @Context UriInfo uriInfo) {
        PersonRelationDto relation = personRelationService.create(request);
        return Response
                .created(uriInfo.getAbsolutePathBuilder().path(relation.id().toString()).build())
                .entity(relation)
                .build();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Find person relation by id", description = "Returns a single person relation by id.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "200",
                    description = "Person relation found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = PersonRelationDto.class)
                    )
            ),
            @APIResponse(
                    responseCode = "404",
                    description = "Person relation not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public PersonRelationDto findById(@PathParam("id") UUID id) {
        return personRelationService.findById(id);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete person relation", description = "Deletes a person relation.")
    @APIResponses(value = {
            @APIResponse(responseCode = "204", description = "Person relation deleted"),
            @APIResponse(
                    responseCode = "404",
                    description = "Person relation not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response deleteRelation(@PathParam("id") UUID id) {
        personRelationService.delete(id);
        return Response.noContent().build();
    }
}