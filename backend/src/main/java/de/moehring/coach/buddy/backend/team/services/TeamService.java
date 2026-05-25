package de.moehring.coach.buddy.backend.team.services;

import de.moehring.coach.buddy.backend.common.exceptions.ConflictException;
import de.moehring.coach.buddy.backend.common.exceptions.NotFoundException;
import de.moehring.coach.buddy.backend.team.dtos.CreateTeamRequest;
import de.moehring.coach.buddy.backend.team.dtos.TeamDto;
import de.moehring.coach.buddy.backend.team.entities.Season;
import de.moehring.coach.buddy.backend.team.entities.Team;
import de.moehring.coach.buddy.backend.team.mappers.TeamMapper;
import de.moehring.coach.buddy.backend.team.repositories.SeasonRepository;
import de.moehring.coach.buddy.backend.team.repositories.TeamRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final SeasonRepository seasonRepository;
    private final TeamMapper teamMapper;

    public List<TeamDto> findAllTeams(UUID seasonId) {
        if (seasonId != null) {
            return teamRepository.findBySeasonId(seasonId)
                    .stream()
                    .map(teamMapper::mapToDto)
                    .toList();
        }

        return teamRepository.findAll()
                .stream()
                .map(teamMapper::mapToDto)
                .toList();
    }

    public TeamDto findById(UUID id) {
        Team team = teamRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Mannschaft wurde nicht gefunden."));

        return teamMapper.mapToDto(team);
    }

    @Transactional
    public TeamDto createTeam(CreateTeamRequest request) {
        Season season = seasonRepository.findByIdOptional(request.seasonId())
                .orElseThrow(() -> new NotFoundException("Saison wurde nicht gefunden."));

        String name = request.name().trim();

        if (teamRepository.existsBySeasonAndName(request.seasonId(), name)) {
            throw new ConflictException("In dieser Saison existiert bereits eine Mannschaft mit diesem Namen.");
        }

        Team team = new Team();
        team.setSeason(season);
        team.setName(name);
        team.setDescription(trimToNull(request.description()));

        teamRepository.persist(team);

        return teamMapper.mapToDto(team);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}