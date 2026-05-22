package de.moehring.coach.buddy.backend.person.dtos;

import de.moehring.coach.buddy.backend.person.util.RelationType;

import java.util.UUID;

public record PersonRelationDto(
        UUID id,
        PersonDto childPerson,
        PersonDto guardianPerson,
        RelationType relationType
) {
}
