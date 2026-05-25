package de.moehring.coach.buddy.backend.training.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingParticipantRequest;
import de.moehring.coach.buddy.backend.training.dtos.TrainingParticipantDto;
import de.moehring.coach.buddy.backend.training.search.TrainingParticipantSearchCriteria;
import de.moehring.coach.buddy.backend.training.services.TrainingParticipantService;
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

@Path("/api/v1/training-participants")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Training Participants", description = "Verwaltung von Trainingsteilnahmen und Anwesenheiten")
public class TrainingParticipantResource {

    private final TrainingParticipantService trainingParticipantService;

    @GET
    @Operation(summary = "Find training participants", description = "Returns training participants matching the optional search criteria.")
    @APIResponse(
            responseCode = "200",
            description = "Training participants found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(type = SchemaType.ARRAY, implementation = TrainingParticipantDto.class)
            )
    )
    public List<TrainingParticipantDto> findAllTrainingParticipants(
            @BeanParam TrainingParticipantSearchCriteria trainingParticipantSearchCriteria
    ) {
        return trainingParticipantService.findAll(trainingParticipantSearchCriteria);
    }

    @POST
    @Operation(summary = "Create training participant", description = "Adds a person to a training with an attendance status.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "201",
                    description = "Training participant created",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = TrainingParticipantDto.class)
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
                    description = "Referenced training or person not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @APIResponse(
                    responseCode = "409",
                    description = "Training participant already exists",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response createTrainingParticipant(
            @Valid CreateTrainingParticipantRequest createTrainingParticipantRequest,
            @Context UriInfo uriInfo
    ) {
        TrainingParticipantDto participant = trainingParticipantService.createTrainingParticipant(createTrainingParticipantRequest);
        return Response
                .created(uriInfo.getAbsolutePathBuilder().path(participant.id().toString()).build())
                .entity(participant)
                .build();
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete training participant", description = "Deletes a mistakenly created training participant entry.")
    @APIResponses(value = {
            @APIResponse(responseCode = "204", description = "Training participant deleted"),
            @APIResponse(
                    responseCode = "404",
                    description = "Training participant not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response deleteTrainingParticipant(@PathParam("id") UUID id) {
        trainingParticipantService.delete(id);
        return Response.noContent().build();
    }
}
