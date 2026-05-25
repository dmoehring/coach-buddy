package de.moehring.coach.buddy.backend.person.dtos;

import de.moehring.coach.buddy.backend.person.util.RelationType;
import io.smallrye.common.constraint.NotNull;

import java.util.UUID;

public record CreatePersonRelationRequest(
        @NotNull UUID childPersonId,
        @NotNull UUID guardianPersonId,
        @NotNull RelationType relationType
) {
}