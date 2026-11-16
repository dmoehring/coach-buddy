import { computed, signal } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';

import { TeamMembershipsService } from '../../api/api/team-memberships.service';
import { TrainingParticipantsService } from '../../api/api/training-participants.service';
import { TrainingsService } from '../../api/api/trainings.service';
import { AttendanceStatus } from '../../api/model/attendance-status';
import { PersonDto } from '../../api/model/person-dto';
import { TeamMemberRole } from '../../api/model/team-member-role';
import { TrainingDto } from '../../api/model/training-dto';
import { TrainingParticipantDto } from '../../api/model/training-participant-dto';
import { TrainingStatus } from '../../api/model/training-status';
import { personName } from '../../shared/util/format';

/** Everything that is stored per participant. */
export interface ParticipantValues {
  attendanceStatus: AttendanceStatus | null;
  jerseyNumber: number | null;
  minutesPlayed: number | null;
  minutesInGoal: number | null;
  notes: string;
}

export interface AttendanceEntry extends ParticipantValues {
  participantId: string | null;
  person: PersonDto;
  role: TeamMemberRole;
  /** What the backend currently has, used to skip no-op saves and to roll back on errors. */
  persisted: ParticipantValues | null;
}

export interface AttendanceServices {
  trainings: TrainingsService;
  memberships: TeamMembershipsService;
  participants: TrainingParticipantsService;
}

const SAVED_HINT_DURATION_MS = 2500;

/**
 * Loads a training with its team members and keeps the recorded participants in sync with
 * the backend: every change is saved right away, one request per person at a time.
 * Shared by the attendance page and the game day page.
 */
export class AttendanceSession {
  private readonly inFlight = new Set<string>();
  private readonly dirty = new Set<string>();
  private savedHintTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly training = signal<TrainingDto | null>(null);
  readonly entries = signal<AttendanceEntry[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saved = signal(false);
  private readonly pendingSaves = signal(0);
  readonly saving = computed(() => this.pendingSaves() > 0);

  readonly players = computed(() => this.entries().filter(entry => entry.role === TeamMemberRole.Player));
  readonly staff = computed(() => this.entries().filter(entry => entry.role !== TeamMemberRole.Player));

  constructor(
    private readonly services: AttendanceServices,
    readonly trainingId: string
  ) {
    this.load();
  }

  static countByStatus(entries: AttendanceEntry[], status: AttendanceStatus | null): number {
    return entries.filter(entry => entry.attendanceStatus === status).length;
  }

  setStatus(entry: AttendanceEntry, attendanceStatus: AttendanceStatus): void {
    if (entry.attendanceStatus !== attendanceStatus) {
      this.change(entry, { attendanceStatus });
    }
  }

  /** Changes values of one person; entering game data for an unrecorded person marks them present. */
  change(entry: AttendanceEntry, changes: Partial<ParticipantValues>): void {
    const personId = entry.person.id!;
    const current = this.entries().find(candidate => candidate.person.id === personId) ?? entry;
    const next: Partial<ParticipantValues> = { ...changes };

    const touchesGameData = 'jerseyNumber' in changes || 'minutesPlayed' in changes || 'minutesInGoal' in changes;
    if (current.attendanceStatus === null && next.attendanceStatus === undefined && touchesGameData) {
      next.attendanceStatus = AttendanceStatus.Present;
    }

    this.updateEntry(personId, next);
    this.persist(personId);
  }

  /** Marks everybody who is not recorded yet as present. */
  markUnrecordedPresent(entries: AttendanceEntry[]): void {
    for (const entry of entries) {
      if (entry.attendanceStatus === null) {
        this.change(entry, { attendanceStatus: AttendanceStatus.Present });
      }
    }
  }

  private persist(personId: string): void {
    // Only one request per person at a time, otherwise quick taps could create duplicate participants.
    if (this.inFlight.has(personId)) {
      this.dirty.add(personId);
      return;
    }

    const entry = this.entries().find(current => current.person.id === personId);

    if (!entry || entry.attendanceStatus === null || this.isPersisted(entry)) {
      return;
    }

    const sent = this.valuesOf(entry);
    const body = {
      attendanceStatus: entry.attendanceStatus,
      jerseyNumber: entry.jerseyNumber ?? undefined,
      minutesPlayed: entry.minutesPlayed ?? undefined,
      minutesInGoal: entry.minutesInGoal ?? undefined,
      notes: entry.notes.trim() || undefined
    };

    const request: Observable<TrainingParticipantDto> = entry.participantId
      ? this.services.participants.apiV1TrainingParticipantsIdPatch(entry.participantId, body)
      : this.services.participants.apiV1TrainingParticipantsPost({
          ...body,
          trainingId: this.trainingId,
          personId
        });

    this.inFlight.add(personId);
    this.pendingSaves.update(count => count + 1);
    this.saveError.set(null);
    this.saved.set(false);

    request.subscribe({
      next: participant => {
        this.updateEntry(personId, {
          participantId: participant.id ?? entry.participantId,
          persisted: sent
        });
        this.finishSave(personId);
      },
      error: error => {
        console.error('Participant could not be saved:', error);

        this.dirty.delete(personId);
        this.rollback(personId, sent);
        this.saveError.set(`Die Änderung für ${personName(entry.person)} konnte nicht gespeichert werden.`);
        this.finishSave(personId);
      }
    });
  }

  private rollback(personId: string, failed: ParticipantValues): void {
    const current = this.entries().find(candidate => candidate.person.id === personId);

    if (!current) {
      return;
    }

    const base: ParticipantValues = current.persisted ?? {
      attendanceStatus: null,
      jerseyNumber: null,
      minutesPlayed: null,
      minutesInGoal: null,
      notes: ''
    };

    // Newer edits made while the request was running are kept; only the failed values are reverted.
    const stillFailedValues = this.isSame(this.valuesOf(current), failed);
    this.updateEntry(personId, stillFailedValues ? base : {});
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
      entries.map(current => (current.person.id === personId ? { ...current, ...changes } : current))
    );
  }

  private valuesOf(entry: ParticipantValues): ParticipantValues {
    return {
      attendanceStatus: entry.attendanceStatus,
      jerseyNumber: entry.jerseyNumber,
      minutesPlayed: entry.minutesPlayed,
      minutesInGoal: entry.minutesInGoal,
      notes: entry.notes.trim()
    };
  }

  private isPersisted(entry: AttendanceEntry): boolean {
    return entry.persisted !== null && this.isSame(this.valuesOf(entry), this.valuesOf(entry.persisted));
  }

  private isSame(left: ParticipantValues, right: ParticipantValues): boolean {
    return left.attendanceStatus === right.attendanceStatus
      && left.jerseyNumber === right.jerseyNumber
      && left.minutesPlayed === right.minutesPlayed
      && left.minutesInGoal === right.minutesInGoal
      && left.notes.trim() === right.notes.trim();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.services.trainings.apiV1TrainingsIdGet(this.trainingId)
      .pipe(
        switchMap(training => {
          this.training.set(training);

          if (training.status !== TrainingStatus.Completed || !training.team?.id) {
            return of({ memberships: [], participants: [] });
          }

          return forkJoin({
            memberships: this.services.memberships.apiV1TeamMembershipsGet(true, undefined, undefined, training.team.id),
            participants: this.services.participants.apiV1TrainingParticipantsGet(undefined, undefined, this.trainingId)
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
          this.error.set('Der Eintrag konnte nicht geladen werden.');
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
        const existing = participants.find(participant => participant.person?.id === membership.person.id);
        const values: ParticipantValues = {
          attendanceStatus: existing?.attendanceStatus ?? null,
          jerseyNumber: existing?.jerseyNumber ?? null,
          minutesPlayed: existing?.minutesPlayed ?? null,
          minutesInGoal: existing?.minutesInGoal ?? null,
          notes: existing?.notes ?? ''
        };

        return {
          ...values,
          participantId: existing?.id ?? null,
          person: membership.person,
          role: membership.role,
          persisted: existing ? values : null
        };
      })
      .sort((left, right) => personName(left.person).localeCompare(personName(right.person), 'de'));
  }
}
