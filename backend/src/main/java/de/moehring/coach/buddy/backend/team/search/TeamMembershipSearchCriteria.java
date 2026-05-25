package de.moehring.coach.buddy.backend.team.search;

import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;
import jakarta.ws.rs.QueryParam;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class TeamMembershipSearchCriteria {

    @QueryParam("personId")
    private UUID personId;

    @QueryParam("teamId")
    private UUID teamId;

    @QueryParam("role")
    private TeamMemberRole role;

    @QueryParam("active")
    private Boolean active;

}