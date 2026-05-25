package de.moehring.coach.buddy.backend.person.search;

import jakarta.ws.rs.QueryParam;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PersonSearchCriteria {

    @QueryParam("birthYear")
    private Integer birthYear;

    @QueryParam("birthMonth")
    private Integer birthMonth;

    @QueryParam("firstName")
    private String firstName;

    @QueryParam("lastName")
    private String lastName;
}