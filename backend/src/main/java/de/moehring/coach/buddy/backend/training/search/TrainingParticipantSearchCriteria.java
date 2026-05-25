package de.moehring.coach.buddy.backend.training.search;

import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;
import jakarta.ws.rs.QueryParam;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class TrainingParticipantSearchCriteria {

    @QueryParam("trainingId")
    private UUID trainingId;

    @QueryParam("personId")
    private UUID personId;

    @QueryParam("attendanceStatus")
    private AttendanceStatus attendanceStatus;
}