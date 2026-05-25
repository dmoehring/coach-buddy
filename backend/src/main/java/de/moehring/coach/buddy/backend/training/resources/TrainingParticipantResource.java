package de.moehring.coach.buddy.backend.training.resources;

import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingParticipantRequest;
import de.moehring.coach.buddy.backend.training.dtos.TrainingParticipantDto;
import de.moehring.coach.buddy.backend.training.search.TrainingParticipantSearchCriteria;
import de.moehring.coach.buddy.backend.training.services.TrainingParticipantService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@Path("/api/v1/training-participants")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class TrainingParticipantResource {

    private final TrainingParticipantService trainingParticipantService;

    @GET
    public List<TrainingParticipantDto> findAllTrainingParticipants(
            @BeanParam TrainingParticipantSearchCriteria trainingParticipantSearchCriteria
    ) {
        return trainingParticipantService.findAll(trainingParticipantSearchCriteria);
    }

    @POST
    public TrainingParticipantDto createTrainingParticipant(
            @Valid CreateTrainingParticipantRequest createTrainingParticipantRequest
    ) {
        return trainingParticipantService.createTrainingParticipant(createTrainingParticipantRequest);
    }

    @DELETE
    @Path("/{id}")
    public Response deleteTrainingParticipant(@PathParam("id") UUID id) {
        trainingParticipantService.delete(id);
        return Response.noContent().build();
    }
}