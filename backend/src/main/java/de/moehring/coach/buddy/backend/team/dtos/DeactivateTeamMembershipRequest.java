package de.moehring.coach.buddy.backend.team.dtos;

import java.time.LocalDate;

public record DeactivateTeamMembershipRequest(
        LocalDate leftAt
) {
}
