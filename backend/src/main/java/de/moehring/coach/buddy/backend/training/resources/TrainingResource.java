package de.moehring.coach.buddy.backend.training.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingRequest;
import de.moehring.coach.buddy.backend.training.dtos.TrainingDto;
import de.moehring.coach.buddy.backend.training.search.TrainingSearchCriteria;
import de.moehring.coach.buddy.backend.training.services.TrainingService;
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

@Path("/api/v1/trainings")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@Tag(name = "Trainings", description = "Verwaltung von Trainingseinheiten")
public class TrainingResource {

    private final TrainingService trainingService;

    @GET
    @Operation(summary = "Find trainings", description = "Returns trainings matching the optional search criteria.")
    @APIResponse(
            responseCode = "200",
            description = "Trainings found",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(type = SchemaType.ARRAY, implementation = TrainingDto.class)
            )
    )
    public List<TrainingDto> findAllTrainings(@BeanParam TrainingSearchCriteria trainingSearchCriteria) {
        return trainingService.findAll(trainingSearchCriteria);
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Find training by id", description = "Returns a single training by id.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "200",
                    description = "Training found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = TrainingDto.class)
                    )
            ),
            @APIResponse(
                    responseCode = "404",
                    description = "Training not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public TrainingDto findById(@PathParam("id") UUID id) {
        return trainingService.findById(id);
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete training", description = "Deletes a mistakenly created training including its participants.")
    @APIResponses(value = {
            @APIResponse(responseCode = "204", description = "Training deleted"),
            @APIResponse(
                    responseCode = "404",
                    description = "Training not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response deleteTraining(@PathParam("id") UUID id) {
        trainingService.delete(id);
        return Response.noContent().build();
    }

    @POST
    @Operation(summary = "Create training", description = "Creates a training for a team.")
    @APIResponses(value = {
            @APIResponse(
                    responseCode = "201",
                    description = "Training created",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = TrainingDto.class)
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
                    description = "Team not found",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    public Response createTraining(@Valid CreateTrainingRequest createTrainingRequest, @Context UriInfo uriInfo) {
        TrainingDto training = trainingService.createTraining(createTrainingRequest);
        return Response
                .created(uriInfo.getAbsolutePathBuilder().path(training.id().toString()).build())
                .entity(training)
                .build();
    }
}
