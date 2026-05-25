package de.moehring.coach.buddy.backend.training.services;

import de.moehring.coach.buddy.backend.common.exceptions.BadRequestException;
import de.moehring.coach.buddy.backend.common.exceptions.NotFoundException;
import de.moehring.coach.buddy.backend.team.entities.Team;
import de.moehring.coach.buddy.backend.team.repositories.TeamRepository;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingRequest;
import de.moehring.coach.buddy.backend.training.dtos.TrainingDto;
import de.moehring.coach.buddy.backend.training.entities.Training;
import de.moehring.coach.buddy.backend.training.mappers.TrainingMapper;
import de.moehring.coach.buddy.backend.training.repositories.TrainingRepository;
import de.moehring.coach.buddy.backend.training.search.TrainingSearchCriteria;
import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TeamRepository teamRepository;
    private final TrainingMapper trainingMapper;

    public List<TrainingDto> findAll(TrainingSearchCriteria criteria) {
        return trainingRepository.search(criteria)
                .stream()
                .map(trainingMapper::mapToDto)
                .toList();
    }

    public TrainingDto findById(UUID id) {
        Training training = trainingRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Training wurde nicht gefunden."));

        return trainingMapper.mapToDto(training);
    }

    @Transactional
    public TrainingDto createTraining(CreateTrainingRequest request) {
        validateTimeRange(request.startTime(), request.endTime());

        Team team = teamRepository.findByIdOptional(request.teamId())
                .orElseThrow(() -> new NotFoundException("Mannschaft wurde nicht gefunden."));

        Training training = new Training();
        training.setTeam(team);
        training.setTrainingDate(request.trainingDate());
        training.setStartTime(request.startTime());
        training.setEndTime(request.endTime());
        training.setLocation(trimToNull(request.location()));
        training.setNotes(trimToNull(request.notes()));
        training.setStatus(request.status() != null ? request.status() : TrainingStatus.COMPLETED);

        trainingRepository.persist(training);

        return trainingMapper.mapToDto(training);
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new BadRequestException("Die Endzeit darf nicht vor der Startzeit liegen.");
        }
    }

    @Transactional
    public void delete(UUID id) {
        Training training = trainingRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Training wurde nicht gefunden."));

        trainingRepository.delete(training);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}