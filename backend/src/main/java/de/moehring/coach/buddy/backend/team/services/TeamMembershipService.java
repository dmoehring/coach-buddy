package de.moehring.coach.buddy.backend.team.services;

import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.common.exceptions.BadRequestException;
import de.moehring.coach.buddy.backend.common.exceptions.NotFoundException;
import de.moehring.coach.buddy.backend.person.repositories.PersonRepository;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.dtos.TeamMembershipDto;
import de.moehring.coach.buddy.backend.team.entities.Team;
import de.moehring.coach.buddy.backend.team.entities.TeamMembership;
import de.moehring.coach.buddy.backend.team.mappers.TeamMembershipMapper;
import de.moehring.coach.buddy.backend.team.repositories.TeamMembershipRepository;
import de.moehring.coach.buddy.backend.team.repositories.TeamRepository;
import de.moehring.coach.buddy.backend.team.search.DeactivateTeamMembershipRequest;
import de.moehring.coach.buddy.backend.team.search.TeamMembershipSearchCriteria;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class TeamMembershipService {

    private final TeamMembershipRepository teamMembershipRepository;
    private final TeamRepository teamRepository;
    private final PersonRepository personRepository;

    private final TeamMembershipMapper teamMembershipMapper;

    public List<TeamMembershipDto> findAll(TeamMembershipSearchCriteria teamMembershipSearchCriteria) {
        return teamMembershipRepository.search(teamMembershipSearchCriteria)
                .stream()
                .map(teamMembershipMapper::mapToDto)
                .toList();
    }

    @Transactional
    public TeamMembershipDto createTeamMembership(CreateTeamMembershipRequest request) {
        Team team = teamRepository.findByIdOptional(request.teamId())
                .orElseThrow(() -> new NotFoundException("Mannschaft wurde nicht gefunden."));

        Person person = personRepository.findByIdOptional(request.personId())
                .orElseThrow(() -> new NotFoundException("Person wurde nicht gefunden."));

        if (teamMembershipRepository.existsByTeamIdAndPersonId(request.teamId(), request.personId())) {
            throw new BadRequestException("Diese Person ist bereits Mitglied dieser Mannschaft.");
        }

        LocalDate joinedAt = request.joinedAt() != null
                ? request.joinedAt()
                : LocalDate.now();

        if (request.leftAt() != null && request.leftAt().isBefore(joinedAt)) {
            throw new BadRequestException("Das Austrittsdatum darf nicht vor dem Eintrittsdatum liegen.");
        }

        TeamMembership teamMembership = new TeamMembership();
        teamMembership.setTeam(team);
        teamMembership.setPerson(person);
        teamMembership.setRole(request.role());
        teamMembership.setJoinedAt(joinedAt);
        teamMembership.setLeftAt(request.leftAt());

        teamMembershipRepository.persist(teamMembership);

        return teamMembershipMapper.mapToDto(teamMembership);
    }

    @Transactional
    public TeamMembershipDto deactivate(UUID id, DeactivateTeamMembershipRequest request) {
        TeamMembership membership = teamMembershipRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Mannschaftsmitgliedschaft wurde nicht gefunden."));

        LocalDate leftAt = request != null && request.leftAt() != null
                ? request.leftAt()
                : LocalDate.now();

        if (leftAt.isBefore(membership.getJoinedAt())) {
            throw new BadRequestException("Das Austrittsdatum darf nicht vor dem Eintrittsdatum liegen.");
        }

        membership.setLeftAt(leftAt);

        return teamMembershipMapper.mapToDto(membership);
    }
}
