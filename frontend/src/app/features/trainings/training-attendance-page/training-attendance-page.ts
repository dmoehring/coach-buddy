import { NgTemplateOutlet } from '@angular/common';
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
  attendanceStatus: AttendanceStatus | null;
  persistedStatus: AttendanceStatus | null;
}

interface AttendanceOption {
  status: AttendanceStatus;
  label: string;
  icon: string;
  tone: 'present' | 'excused' | 'absent';
}

const SAVED_HINT_DURATION_MS = 2500;

@Component({
  selector: 'app-training-attendance-page',
  imports: [
    NgTemplateOutlet,
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
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/trainings';

  readonly attendanceOptions: AttendanceOption[] = [
    { status: AttendanceStatus.Present, label: 'Anwesend', icon: 'pi pi-check', tone: 'present' },
    { status: AttendanceStatus.Excused, label: 'Entschuldigt', icon: 'pi pi-info-circle', tone: 'excused' },
    { status: AttendanceStatus.Absent, label: 'Unentschuldigt', icon: 'pi pi-times', tone: 'absent' }
  ];

  private readonly inFlight = new Set<string>();
  private readonly dirty = new Set<string>();
  private savedHintTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly training = signal<TrainingDto | null>(null);
  readonly entries = signal<AttendanceEntry[]>([]);

  readonly loading = signal(true);
  readonly pendingSaves = signal(0);
  readonly saving = computed(() => this.pendingSaves() > 0);
  readonly saved = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly error = signal<string | null>(null);

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
    if (entry.attendanceStatus === attendanceStatus) {
      return;
    }

    const personId = entry.person.id!;

    this.updateEntry(personId, { attendanceStatus });
    this.persist(personId);
  }

  private persist(personId: string): void {
    // Only one request per person at a time, otherwise quick taps could create duplicate participants.
    if (this.inFlight.has(personId)) {
      this.dirty.add(personId);
      return;
    }

    const entry = this.entries().find(current => current.person.id === personId);

    if (!entry || entry.attendanceStatus === null || entry.attendanceStatus === entry.persistedStatus) {
      return;
    }

    const sentStatus = entry.attendanceStatus;
    const request: Observable<TrainingParticipantDto> = entry.participantId
      ? this.trainingParticipantsService.apiV1TrainingParticipantsIdPatch(entry.participantId, {
          attendanceStatus: sentStatus
        })
      : this.trainingParticipantsService.apiV1TrainingParticipantsPost({
          trainingId: this.trainingId,
          personId,
          attendanceStatus: sentStatus
        });

    this.inFlight.add(personId);
    this.pendingSaves.update(count => count + 1);
    this.saveError.set(null);
    this.saved.set(false);

    request.subscribe({
      next: participant => {
        this.updateEntry(personId, {
          participantId: participant.id ?? entry.participantId,
          persistedStatus: sentStatus
        });
        this.finishSave(personId);
      },
      error: error => {
        console.error('Attendance could not be saved:', error);
        console.error('Backend error body:', error.error);

        const current = this.entries().find(candidate => candidate.person.id === personId);

        this.dirty.delete(personId);
        this.updateEntry(personId, {
          attendanceStatus: current ? current.persistedStatus : sentStatus
        });
        this.saveError.set(
          `Die Anwesenheit von ${this.getPersonName(entry.person)} konnte nicht gespeichert werden.`
        );
        this.finishSave(personId);
      }
    });
  }

  private finishSave(personId: string): void {
    this.inFlight.delete(personId);
    this.pendingSaves.update(count => count - 1);

    if (this.dirty.delete(personId)) {
      this.persist(personId);
      return;
    }

    if (this.pendingSaves() === 0 && !this.saveError()) {
      this.showSavedHint();
    }
  }

  private showSavedHint(): void {
    this.saved.set(true);

    if (this.savedHintTimeout) {
      clearTimeout(this.savedHintTimeout);
    }

    this.savedHintTimeout = setTimeout(() => this.saved.set(false), SAVED_HINT_DURATION_MS);
  }

  private updateEntry(personId: string, changes: Partial<AttendanceEntry>): void {
    this.entries.update(entries =>
      entries.map(current =>
        current.person.id === personId ? { ...current, ...changes } : current
      )
    );
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
          attendanceStatus: existingParticipant?.attendanceStatus ?? null,
          persistedStatus: existingParticipant?.attendanceStatus ?? null
        };
      })
      .sort((left, right) => this.getPersonName(left.person).localeCompare(this.getPersonName(right.person), 'de'));
  }

  private countByStatus(entries: AttendanceEntry[], status: AttendanceStatus): number {
    return entries.filter(entry => entry.attendanceStatus === status).length;
  }
}
