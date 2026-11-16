package de.moehring.coach.buddy.backend.export.services;

import de.moehring.coach.buddy.backend.common.exceptions.NotFoundException;
import de.moehring.coach.buddy.backend.export.util.CsvWriter;
import de.moehring.coach.buddy.backend.export.util.ExportFormat;
import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.person.entities.PersonRelation;
import de.moehring.coach.buddy.backend.person.repositories.PersonRelationRepository;
import de.moehring.coach.buddy.backend.team.entities.Team;
import de.moehring.coach.buddy.backend.team.entities.TeamMembership;
import de.moehring.coach.buddy.backend.team.repositories.TeamMembershipRepository;
import de.moehring.coach.buddy.backend.team.repositories.TeamRepository;
import de.moehring.coach.buddy.backend.team.search.TeamMembershipSearchCriteria;
import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;
import de.moehring.coach.buddy.backend.training.entities.Training;
import de.moehring.coach.buddy.backend.training.entities.TrainingParticipant;
import de.moehring.coach.buddy.backend.training.repositories.TrainingParticipantRepository;
import de.moehring.coach.buddy.backend.training.repositories.TrainingRepository;
import de.moehring.coach.buddy.backend.training.search.TrainingParticipantSearchCriteria;
import de.moehring.coach.buddy.backend.training.search.TrainingSearchCriteria;
import de.moehring.coach.buddy.backend.training.util.AttendanceStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingStatus;
import de.moehring.coach.buddy.backend.training.util.TrainingType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
@RequiredArgsConstructor
public class ExportService {

    private static final Comparator<Person> BY_NAME = Comparator
            .comparing((Person person) -> person.getLastName().toLowerCase())
            .thenComparing(person -> person.getFirstName().toLowerCase());

    private final TeamRepository teamRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final TrainingRepository trainingRepository;
    private final TrainingParticipantRepository trainingParticipantRepository;
    private final PersonRelationRepository personRelationRepository;

    public record CsvExport(String fileName, byte[] content) {
    }

    /**
     * Member list with contact data. Without a team all teams are included.
     */
    @Transactional
    public CsvExport exportMembers(UUID teamId, boolean activeOnly) {
        Team team = teamId == null ? null : findTeam(teamId);

        TeamMembershipSearchCriteria criteria = new TeamMembershipSearchCriteria();
        criteria.setTeamId(teamId);
        criteria.setActive(activeOnly ? Boolean.TRUE : null);

        List<TeamMembership> memberships = new ArrayList<>(teamMembershipRepository.search(criteria));
        memberships.sort(Comparator
                .comparing((TeamMembership m) -> m.getTeam().getName().toLowerCase())
                .thenComparing(m -> m.getRole())
                .thenComparing(TeamMembership::getPerson, BY_NAME));

        CsvWriter csv = new CsvWriter().row(
                "Nachname", "Vorname", "Spitzname", "Geburtsdatum", "Mannschaft", "Saison",
                "Rolle", "Eintritt", "Austritt", "Telefon", "Erziehungsberechtigte", "Notiz"
        );

        for (TeamMembership membership : memberships) {
            Person person = membership.getPerson();
            csv.row(
                    person.getLastName(),
                    person.getFirstName(),
                    person.getNickname(),
                    ExportFormat.date(person.getBirthDate()),
                    membership.getTeam().getName(),
                    membership.getTeam().getSeason().getName(),
                    ExportFormat.role(membership.getRole()),
                    ExportFormat.date(membership.getJoinedAt()),
                    ExportFormat.date(membership.getLeftAt()),
                    ExportFormat.phoneNumbers(person.getPhoneNumbers()),
                    guardians(person),
                    person.getNotes()
            );
        }

        String scope = team == null ? "alle-teams" : ExportFormat.slug(team.getName());
        String suffix = activeOnly ? "mitglieder" : "mitglieder-inkl-ehemalige";
        return new CsvExport(suffix + "-" + scope + ".csv", csv.toBytes());
    }

    /**
     * Participants of one training or game day. For game days the jersey number and
     * playing times are included, ordered by jersey number.
     */
    @Transactional
    public CsvExport exportTrainingParticipants(UUID trainingId, boolean onlyPresent) {
        Training training = trainingRepository.findByIdOptional(trainingId)
                .orElseThrow(() -> new NotFoundException("Training wurde nicht gefunden."));

        TrainingParticipantSearchCriteria criteria = new TrainingParticipantSearchCriteria();
        criteria.setTrainingId(trainingId);
        criteria.setAttendanceStatus(onlyPresent ? AttendanceStatus.PRESENT : null);

        boolean gameDay = training.getType() == TrainingType.GAME_DAY;

        List<TrainingParticipant> participants = new ArrayList<>(trainingParticipantRepository.search(criteria));
        Comparator<TrainingParticipant> byName = Comparator.comparing(TrainingParticipant::getPerson, BY_NAME);
        participants.sort(gameDay
                ? Comparator.comparing(TrainingParticipant::getJerseyNumber, Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
                .thenComparing(byName)
                : byName);

        Map<UUID, TeamMemberRole> roles = rolesInTeam(training.getTeam());

        CsvWriter csv = new CsvWriter().row(header(gameDay));

        for (TrainingParticipant participant : participants) {
            Person person = participant.getPerson();
            TeamMemberRole role = roles.get(person.getId());

            List<Object> row = new ArrayList<>();
            row.add(person.getLastName());
            row.add(person.getFirstName());
            row.add(ExportFormat.date(person.getBirthDate()));
            row.add(role == null ? "" : ExportFormat.role(role));
            row.add(ExportFormat.attendance(participant.getAttendanceStatus()));
            if (gameDay) {
                row.add(participant.getJerseyNumber());
                row.add(participant.getMinutesPlayed());
                row.add(participant.getMinutesInGoal());
            }
            row.add(participant.getNotes());
            csv.row(row);
        }

        String name = training.getTitle() != null && !training.getTitle().isBlank()
                ? training.getTitle()
                : (gameDay ? "spielfest" : "training");
        String fileName = ExportFormat.slug(name) + "-" + training.getTrainingDate() + "-teilnehmer.csv";
        return new CsvExport(fileName, csv.toBytes());
    }

    /**
     * Attendance matrix of a team: one row per member, one column per completed training.
     */
    @Transactional
    public CsvExport exportAttendanceMatrix(UUID teamId) {
        Team team = findTeam(teamId);

        TrainingSearchCriteria trainingCriteria = new TrainingSearchCriteria();
        trainingCriteria.setTeamId(teamId);
        trainingCriteria.setStatus(TrainingStatus.COMPLETED);

        List<Training> trainings = new ArrayList<>(trainingRepository.search(trainingCriteria));
        trainings.sort(Comparator.comparing(Training::getTrainingDate)
                .thenComparing(Training::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())));

        Map<String, AttendanceStatus> statusByTrainingAndPerson = new HashMap<>();
        for (Training training : trainings) {
            TrainingParticipantSearchCriteria participantCriteria = new TrainingParticipantSearchCriteria();
            participantCriteria.setTrainingId(training.getId());
            for (TrainingParticipant participant : trainingParticipantRepository.search(participantCriteria)) {
                statusByTrainingAndPerson.put(
                        key(training.getId(), participant.getPerson().getId()),
                        participant.getAttendanceStatus()
                );
            }
        }

        TeamMembershipSearchCriteria membershipCriteria = new TeamMembershipSearchCriteria();
        membershipCriteria.setTeamId(teamId);
        List<TeamMembership> memberships = new ArrayList<>(teamMembershipRepository.search(membershipCriteria));
        memberships.sort(Comparator
                .comparing((TeamMembership m) -> m.getRole())
                .thenComparing(TeamMembership::getPerson, BY_NAME));

        List<Object> header = new ArrayList<>(List.of("Nachname", "Vorname", "Rolle"));
        for (Training training : trainings) {
            String label = ExportFormat.date(training.getTrainingDate());
            header.add(training.getType() == TrainingType.GAME_DAY ? label + " (Spielfest)" : label);
        }
        header.addAll(List.of("Anwesend", "Entschuldigt", "Unentschuldigt", "Nicht erfasst", "Anwesenheitsquote"));

        CsvWriter csv = new CsvWriter().row(header);

        for (TeamMembership membership : memberships) {
            Person person = membership.getPerson();
            List<Object> row = new ArrayList<>();
            row.add(person.getLastName());
            row.add(person.getFirstName());
            row.add(ExportFormat.role(membership.getRole()));

            Map<AttendanceStatus, Integer> counts = new HashMap<>();
            int unrecorded = 0;
            for (Training training : trainings) {
                AttendanceStatus status = statusByTrainingAndPerson.get(key(training.getId(), person.getId()));
                if (status == null) {
                    row.add("");
                    unrecorded++;
                } else {
                    row.add(ExportFormat.attendance(status));
                    counts.merge(status, 1, Integer::sum);
                }
            }

            int recorded = trainings.size() - unrecorded;
            int present = counts.getOrDefault(AttendanceStatus.PRESENT, 0);
            row.add(present);
            row.add(counts.getOrDefault(AttendanceStatus.EXCUSED, 0));
            row.add(counts.getOrDefault(AttendanceStatus.ABSENT, 0));
            row.add(unrecorded);
            row.add(recorded == 0 ? "" : Math.round(present * 100.0 / recorded) + " %");
            csv.row(row);
        }

        return new CsvExport("anwesenheit-" + ExportFormat.slug(team.getName()) + ".csv", csv.toBytes());
    }

    private List<Object> header(boolean gameDay) {
        List<Object> header = new ArrayList<>(List.of("Nachname", "Vorname", "Geburtsdatum", "Rolle", "Anwesenheit"));
        if (gameDay) {
            header.addAll(List.of("Trikotnummer", "Spielzeit (Min.)", "Im Tor (Min.)"));
        }
        header.add("Notiz");
        return header;
    }

    private Team findTeam(UUID teamId) {
        return teamRepository.findByIdOptional(teamId)
                .orElseThrow(() -> new NotFoundException("Mannschaft wurde nicht gefunden."));
    }

    private Map<UUID, TeamMemberRole> rolesInTeam(Team team) {
        TeamMembershipSearchCriteria criteria = new TeamMembershipSearchCriteria();
        criteria.setTeamId(team.getId());
        return teamMembershipRepository.search(criteria).stream()
                .collect(Collectors.toMap(
                        membership -> membership.getPerson().getId(),
                        TeamMembership::getRole,
                        (first, second) -> first
                ));
    }

    private String guardians(Person child) {
        return personRelationRepository.findByChildPersonId(child.getId()).stream()
                .map(this::describeGuardian)
                .collect(Collectors.joining("; "));
    }

    private String describeGuardian(PersonRelation relation) {
        Person guardian = relation.getGuardianPerson();
        String phones = ExportFormat.phoneNumbers(guardian.getPhoneNumbers());
        String base = ExportFormat.fullName(guardian) + " (" + ExportFormat.relation(relation.getRelationType()) + ")";
        return phones.isEmpty() ? base : base + ": " + phones;
    }

    private String key(UUID trainingId, UUID personId) {
        return trainingId + ":" + personId;
    }
}
