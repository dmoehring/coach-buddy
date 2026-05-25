package de.moehring.coach.buddy.backend.training.search;

import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import jakarta.ws.rs.QueryParam;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class TrainingSearchCriteria {

    @QueryParam("teamId")
    private UUID teamId;

    @QueryParam("trainingDate")
    private LocalDate trainingDate;

    @QueryParam("dateFrom")
    private LocalDate dateFrom;

    @QueryParam("dateTo")
    private LocalDate dateTo;

    @QueryParam("status")
    private TrainingStatus status;
}