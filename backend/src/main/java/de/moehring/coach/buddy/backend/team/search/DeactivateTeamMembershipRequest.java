package de.moehring.coach.buddy.backend.team.search;

import java.time.LocalDate;

public record DeactivateTeamMembershipRequest(
        LocalDate leftAt
) {
}
