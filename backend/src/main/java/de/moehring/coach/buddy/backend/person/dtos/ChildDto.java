package de.moehring.coach.buddy.backend.person.dtos;

import de.moehring.coach.buddy.backend.person.util.RelationType;

import java.util.List;
import java.util.Map;

public record ChildDto(
        PersonDto child,
        Map<RelationType, List<PersonDto>> guardians
) {
}
