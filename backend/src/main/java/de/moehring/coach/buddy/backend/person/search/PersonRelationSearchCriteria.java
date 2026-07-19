package de.moehring.coach.buddy.backend.person.search;

import jakarta.ws.rs.QueryParam;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class PersonRelationSearchCriteria {

    @QueryParam("childPersonId")
    private UUID childPersonId;

    @QueryParam("guardianPersonId")
    private UUID guardianPersonId;
}
