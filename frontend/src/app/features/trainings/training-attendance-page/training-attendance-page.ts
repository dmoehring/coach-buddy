import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, forkJoin, of, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { TrainingsService } from '../../../api/api/trainings.service';
import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { TrainingParticipantsService } from '../../../api/api/training-participants.service';

import { AttendanceStatus } from '../../../api/model/attendance-status';
import { PersonDto } from '../../../api/model/person-dto';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingParticipantDto } from '../../../api/model/training-participant-dto';
import { TrainingStatus } from '../../../api/model/training-status';

interface AttendanceEntry {
  participantId: string | null;
  person: PersonDto;
  role: TeamMemberRole;
  attendanceStatus: AttendanceStatus;
}

@Component({
  selector: 'app-training-attendance-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule
  ],
  templateUrl: './training-attendance-page.html',
  styleUrl: './training-attendance-page.scss'
})
export class TrainingAttendancePage {
  private readonly route = inject(ActivatedRoute);
  private readonly trainingsService = inject(TrainingsService);
  private readonly teamMembershipsService = inject(TeamMembershipsService);
  private readonly trainingParticipantsService = inject(TrainingParticipantsService);

  readonly trainingId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly training = signal<TrainingDto | null>(null);
  readonly entries = signal<AttendanceEntry[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly playerParticipants = computed(() =>
    this.entries().filter(entry => entry.role === TeamMemberRole.Player)
  );

  readonly trainerParticipants = computed(() =>
    this.entries().filter(entry => entry.role !== TeamMemberRole.Player)
  );

  readonly presentPlayersCount = computed(() =>
    this.countByStatus(this.playerParticipants(), AttendanceStatus.Present)
  );

  readonly excusedPlayersCount = computed(() =>
    this.countByStatus(this.playerParticipants(), AttendanceStatus.Excused)
  );

  readonly absentPlayersCount = computed(() =>
    this.countByStatus(this.playerParticipants(), AttendanceStatus.Absent)
  );

  readonly presentTrainersCount = computed(() =>
    this.countByStatus(this.trainerParticipants(), AttendanceStatus.Present)
  );

  readonly excusedTrainersCount = computed(() =>
    this.countByStatus(this.trainerParticipants(), AttendanceStatus.Excused)
  );

  readonly absentTrainersCount = computed(() =>
    this.countByStatus(this.trainerParticipants(), AttendanceStatus.Absent)
  );

  constructor() {
    if (!this.trainingId) {
      this.error.set('Es wurde keine Trainings-ID übergeben.');
      this.loading.set(false);
      return;
    }

    this.loadData(this.trainingId);
  }

  setAttendance(entry: AttendanceEntry, attendanceStatus: AttendanceStatus): void {
    this.entries.update(entries =>
      entries.map(current =>
        current === entry ? { ...current, attendanceStatus } : current
      )
    );
  }

  saveAttendance(): void {
    const requests: Observable<TrainingParticipantDto>[] = this.entries().map(entry => {
      if (entry.participantId) {
        return this.trainingParticipantsService.apiV1TrainingParticipantsIdPatch(entry.participantId, {
          attendanceStatus: entry.attendanceStatus
        });
      }

      return this.trainingParticipantsService.apiV1TrainingParticipantsPost({
        trainingId: this.trainingId,
        personId: entry.person.id!,
        attendanceStatus: entry.attendanceStatus
      });
    });

    if (requests.length === 0) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    forkJoin(requests).subscribe({
      next: participants => {
        this.entries.update(entries =>
          entries.map((entry, index) => ({
            ...entry,
            participantId: participants[index].id ?? entry.participantId
          }))
        );

        this.saving.set(false);
        this.success.set('Die Anwesenheit wurde gespeichert.');
      },
      error: error => {
        console.error('Attendance could not be saved:', error);
        console.error('Backend error body:', error.error);

        this.saving.set(false);
        this.error.set('Die Anwesenheit konnte nicht gespeichert werden.');
      }
    });
  }

  getAttendanceLabel(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.Present:
        return 'Anwesend';
      case AttendanceStatus.Excused:
        return 'Entschuldigt';
      case AttendanceStatus.Absent:
        return 'Unentschuldigt';
    }
  }

  getAttendanceSeverity(status: AttendanceStatus): 'success' | 'warn' | 'danger' {
    switch (status) {
      case AttendanceStatus.Present:
        return 'success';
      case AttendanceStatus.Excused:
        return 'warn';
      case AttendanceStatus.Absent:
        return 'danger';
    }
  }

  getRoleLabel(role: TeamMemberRole): string {
    switch (role) {
      case TeamMemberRole.Player:
        return 'Teilnehmer';
      case TeamMemberRole.Coach:
        return 'Trainer';
      case TeamMemberRole.AssistantCoach:
        return 'Helfer';
      default:
        return 'Unbekannt';
    }
  }

  getPersonName(person: PersonDto): string {
    return [person.firstName, person.lastName].filter(Boolean).join(' ');
  }

  getTrainingStatusLabel(status?: TrainingStatus): string {
    return status === TrainingStatus.Completed ? 'Stattgefunden' : 'Ausgefallen';
  }

  getTrainingStatusSeverity(status?: TrainingStatus): 'success' | 'danger' {
    return status === TrainingStatus.Completed ? 'success' : 'danger';
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}.${month}.${year}`;
  }

  getTimeRange(): string {
    const training = this.training();

    if (!training?.startTime && !training?.endTime) {
      return '-';
    }

    if (training?.startTime && training?.endTime) {
      return `${training.startTime} - ${training.endTime}`;
    }

    return training?.startTime ?? training?.endTime ?? '-';
  }

  private loadData(trainingId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.trainingsService.apiV1TrainingsIdGet(trainingId)
      .pipe(
        switchMap(training => {
          this.training.set(training);

          if (training.status !== TrainingStatus.Completed || !training.team?.id) {
            return of({ memberships: [], participants: [] });
          }

          return forkJoin({
            memberships: this.teamMembershipsService.apiV1TeamMembershipsGet(
              true,
              undefined,
              undefined,
              training.team.id
            ),
            participants: this.trainingParticipantsService.apiV1TrainingParticipantsGet(
              undefined,
              undefined,
              trainingId
            )
          });
        })
      )
      .subscribe({
        next: ({ memberships, participants }) => {
          this.entries.set(this.buildEntries(memberships, participants));
          this.loading.set(false);
        },
        error: error => {
          console.error('Training could not be loaded:', error);
          console.error('Backend error body:', error.error);

          this.error.set('Das Training konnte nicht geladen werden.');
          this.loading.set(false);
        }
      });
  }

  private buildEntries(
    memberships: { person?: PersonDto; role?: TeamMemberRole }[],
    participants: TrainingParticipantDto[]
  ): AttendanceEntry[] {
    return memberships
      .filter((membership): membership is { person: PersonDto; role: TeamMemberRole } =>
        Boolean(membership.person?.id && membership.role)
      )
      .map(membership => {
        const existingParticipant = participants.find(
          participant => participant.person?.id === membership.person.id
        );

        return {
          participantId: existingParticipant?.id ?? null,
          person: membership.person,
          role: membership.role,
          attendanceStatus: existingParticipant?.attendanceStatus ?? AttendanceStatus.Present
        };
      })
      .sort((left, right) => this.getPersonName(left.person).localeCompare(this.getPersonName(right.person), 'de'));
  }

  private countByStatus(entries: AttendanceEntry[], status: AttendanceStatus): number {
    return entries.filter(entry => entry.attendanceStatus === status).length;
  }
}
