package de.moehring.coach.buddy.backend.training.resources;

import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingRequest;
import de.moehring.coach.buddy.backend.training.dtos.TrainingDto;
import de.moehring.coach.buddy.backend.training.search.TrainingSearchCriteria;
import de.moehring.coach.buddy.backend.training.services.TrainingService;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@Path("/api/v1/trainings")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class TrainingResource {

    private final TrainingService trainingService;

    @GET
    public List<TrainingDto> findAllTrainings(@BeanParam TrainingSearchCriteria trainingSearchCriteria) {
        return trainingService.findAll(trainingSearchCriteria);
    }

    @GET
    @Path("/{id}")
    public TrainingDto findById(@PathParam("id") UUID id) {
        return trainingService.findById(id);
    }

    @DELETE
    @Path("/{id}")
    public Response deleteTraining(@PathParam("id") UUID id) {
        trainingService.delete(id);
        return Response.noContent().build();
    }

    @POST
    public TrainingDto createTraining(@Valid CreateTrainingRequest createTrainingRequest) {
        return trainingService.createTraining(createTrainingRequest);
    }
}