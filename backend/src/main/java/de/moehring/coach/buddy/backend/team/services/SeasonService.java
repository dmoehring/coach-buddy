package de.moehring.coach.buddy.backend.team.services;

import de.moehring.coach.buddy.backend.common.exceptions.BadRequestException;
import de.moehring.coach.buddy.backend.team.dtos.CreateSeasonRequest;
import de.moehring.coach.buddy.backend.team.dtos.SeasonDto;
import de.moehring.coach.buddy.backend.team.entities.Season;
import de.moehring.coach.buddy.backend.team.mappers.SeasonMapper;
import de.moehring.coach.buddy.backend.team.repositories.SeasonRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
@RequiredArgsConstructor
public class SeasonService {

    private final SeasonRepository seasonRepository;
    private final SeasonMapper seasonMapper;

    public List<SeasonDto> findAllSeasons() {
        return seasonRepository.findAll()
                .stream()
                .map(seasonMapper::mapToDto)
                .toList();
    }

    @Transactional
    public SeasonDto createSeason(CreateSeasonRequest createSeasonRequest) {
        validateRequest(createSeasonRequest);

        Optional<Season> openSeasonOptional = seasonRepository.findOpenSeason();

        openSeasonOptional.ifPresent(openSeason -> closeOpenSeason(openSeason, createSeasonRequest.startDate()));

        Season season = new Season();
        season.setName(createSeasonRequest.name().trim());
        season.setStartDate(createSeasonRequest.startDate());
        season.setEndDate(null);

        seasonRepository.persist(season);

        return seasonMapper.mapToDto(season);
    }

    private void validateRequest(CreateSeasonRequest request) {
        if (seasonRepository.existsByName(request.name())) {
            throw new BadRequestException("Eine Saison mit diesem Namen existiert bereits.");
        }

        Optional<Season> openSeasonOptional = seasonRepository.findOpenSeason();

        if (openSeasonOptional.isPresent()) {
            Season openSeason = openSeasonOptional.get();

            if (!request.startDate().isAfter(openSeason.getStartDate())) {
                throw new BadRequestException("Das Startdatum der neuen Saison muss nach dem Startdatum der offenen Saison liegen.");
            }
        }
    }

    private void closeOpenSeason(Season openSeason, LocalDate newSeasonStartDate) {
        LocalDate endDate = newSeasonStartDate.minusDays(1);

        if (endDate.isBefore(openSeason.getStartDate())) {
            throw new BadRequestException("Die bestehende offene Saison kann mit diesem Startdatum nicht geschlossen werden.");
        }

        seasonRepository.closeOpenSeason(endDate);
        seasonRepository.flush();
    }
}