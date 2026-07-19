package de.moehring.coach.buddy.backend.training.services;

import de.moehring.coach.buddy.backend.common.exceptions.ConflictException;
import de.moehring.coach.buddy.backend.common.exceptions.NotFoundException;
import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.person.repositories.PersonRepository;
import de.moehring.coach.buddy.backend.training.dtos.CreateTrainingParticipantRequest;
import de.moehring.coach.buddy.backend.training.dtos.TrainingParticipantDto;
import de.moehring.coach.buddy.backend.training.dtos.UpdateTrainingParticipantRequest;
import de.moehring.coach.buddy.backend.training.entities.Training;
import de.moehring.coach.buddy.backend.training.entities.TrainingParticipant;
import de.moehring.coach.buddy.backend.training.mappers.TrainingParticipantMapper;
import de.moehring.coach.buddy.backend.training.repositories.TrainingParticipantRepository;
import de.moehring.coach.buddy.backend.training.repositories.TrainingRepository;
import de.moehring.coach.buddy.backend.training.search.TrainingParticipantSearchCriteria;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class TrainingParticipantService {

    private final TrainingParticipantRepository trainingParticipantRepository;
    private final TrainingRepository trainingRepository;
    private final PersonRepository personRepository;
    private final TrainingParticipantMapper trainingParticipantMapper;

    public List<TrainingParticipantDto> findAll(TrainingParticipantSearchCriteria criteria) {
        return trainingParticipantRepository.search(criteria)
                .stream()
                .map(trainingParticipantMapper::mapToDto)
                .toList();
    }

    @Transactional
    public TrainingParticipantDto createTrainingParticipant(CreateTrainingParticipantRequest request) {
        Training training = trainingRepository.findByIdOptional(request.trainingId())
                .orElseThrow(() -> new NotFoundException("Training wurde nicht gefunden."));

        Person person = personRepository.findByIdOptional(request.personId())
                .orElseThrow(() -> new NotFoundException("Person wurde nicht gefunden."));

        if (trainingParticipantRepository.existsByTrainingIdAndPersonId(request.trainingId(), request.personId())) {
            throw new ConflictException("Diese Person wurde bereits für dieses Training erfasst.");
        }

        TrainingParticipant trainingParticipant = new TrainingParticipant();
        trainingParticipant.setTraining(training);
        trainingParticipant.setPerson(person);
        trainingParticipant.setAttendanceStatus(request.attendanceStatus());
        trainingParticipant.setNotes(trimToNull(request.notes()));

        trainingParticipantRepository.persist(trainingParticipant);

        return trainingParticipantMapper.mapToDto(trainingParticipant);
    }

    @Transactional
    public TrainingParticipantDto updateAttendance(UUID id, UpdateTrainingParticipantRequest request) {
        TrainingParticipant trainingParticipant = trainingParticipantRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Trainingsteilnahme wurde nicht gefunden."));

        trainingParticipant.setAttendanceStatus(request.attendanceStatus());
        trainingParticipant.setNotes(trimToNull(request.notes()));

        return trainingParticipantMapper.mapToDto(trainingParticipant);
    }

    @Transactional
    public void delete(UUID id) {
        TrainingParticipant trainingParticipant = trainingParticipantRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Trainingsteilnahme wurde nicht gefunden."));

        trainingParticipantRepository.delete(trainingParticipant);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}