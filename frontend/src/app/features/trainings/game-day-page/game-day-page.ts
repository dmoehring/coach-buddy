import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { TrainingParticipantsService } from '../../../api/api/training-participants.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { AttendanceStatus } from '../../../api/model/attendance-status';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TrainingStatus } from '../../../api/model/training-status';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CsvExportService } from '../../../shared/util/export.service';
import {
  ROLE_LABELS,
  formatDate,
  initials,
  personName,
  timeRange,
  trainingTitle,
  weekday
} from '../../../shared/util/format';
import { AttendanceToggle } from '../components/attendance-toggle/attendance-toggle';
import { AttendanceEntry, AttendanceSession, ParticipantValues } from '../attendance-session';

type NumberField = 'jerseyNumber' | 'minutesPlayed' | 'minutesInGoal';

interface SummaryRow {
  entry: AttendanceEntry;
  duplicateJersey: boolean;
}

@Component({
  selector: 'app-game-day-page',
  imports: [RouterLink, ButtonModule, PageHeader, AttendanceToggle],
  templateUrl: './game-day-page.html',
  styleUrl: './game-day-page.scss'
})
export class GameDayPage {
  private readonly route = inject(ActivatedRoute);
  readonly csv = inject(CsvExportService);

  readonly trainingId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/trainings';

  readonly session = new AttendanceSession(
    {
      trainings: inject(TrainingsService),
      memberships: inject(TeamMembershipsService),
      participants: inject(TrainingParticipantsService)
    },
    this.trainingId
  );

  readonly Cancelled = TrainingStatus.Cancelled;
  readonly Present = AttendanceStatus.Present;

  readonly present = computed(() => AttendanceSession.countByStatus(this.session.players(), AttendanceStatus.Present));
  readonly open = computed(() => AttendanceSession.countByStatus(this.session.players(), null));
  readonly staffPresent = computed(() => AttendanceSession.countByStatus(this.session.staff(), AttendanceStatus.Present));

  readonly totalGoalMinutes = computed(() =>
    this.session.players().reduce((sum, entry) => sum + (entry.minutesInGoal ?? 0), 0)
  );

  /** Present players ordered by jersey number; players without a number come last. */
  readonly summary = computed<SummaryRow[]>(() => {
    const present = this.session.players().filter(entry => entry.attendanceStatus === AttendanceStatus.Present);
    const counts = new Map<number, number>();

    for (const entry of present) {
      if (entry.jerseyNumber !== null) {
        counts.set(entry.jerseyNumber, (counts.get(entry.jerseyNumber) ?? 0) + 1);
      }
    }

    return [...present]
      .sort((left, right) =>
        (left.jerseyNumber ?? Number.MAX_SAFE_INTEGER) - (right.jerseyNumber ?? Number.MAX_SAFE_INTEGER)
        || personName(left.person).localeCompare(personName(right.person), 'de')
      )
      .map(entry => ({
        entry,
        duplicateJersey: entry.jerseyNumber !== null && (counts.get(entry.jerseyNumber) ?? 0) > 1
      }));
  });

  readonly duplicateJerseys = computed(() => this.summary().filter(row => row.duplicateJersey).length > 0);

  readonly title = computed(() => {
    const training = this.session.training();

    return training ? trainingTitle(training) : 'Spielfest';
  });

  readonly subtitle = computed(() => {
    const training = this.session.training();

    if (!training) {
      return null;
    }

    const when = `${weekday(training.trainingDate)}, ${formatDate(training.trainingDate)}`;

    return [when, timeRange(training.startTime, training.endTime), training.location]
      .filter(Boolean)
      .join(' · ');
  });

  exportParticipants(): void {
    this.csv.trainingParticipants(this.trainingId);
  }

  select(entry: AttendanceEntry, status: AttendanceStatus): void {
    this.session.setStatus(entry, status);
  }

  markAllPresent(): void {
    this.session.markUnrecordedPresent(this.session.players());
  }

  setNumber(entry: AttendanceEntry, field: NumberField, event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    const parsed = raw === '' ? null : Math.round(Number(raw));
    const value = parsed !== null && Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 999) : null;

    // Show the clamped value even if it equals the previous model value and nothing re-renders.
    (event.target as HTMLInputElement).value = value === null ? '' : `${value}`;

    if (entry[field] !== value) {
      this.session.change(entry, { [field]: value } as Partial<ParticipantValues>);
    }
  }

  setNotes(entry: AttendanceEntry, event: Event): void {
    const notes = (event.target as HTMLInputElement).value;

    if (entry.notes !== notes) {
      this.session.change(entry, { notes });
    }
  }

  name(entry: AttendanceEntry): string {
    return personName(entry.person);
  }

  initials(entry: AttendanceEntry): string {
    return initials(entry.person);
  }

  roleLabel(role: TeamMemberRole): string {
    return ROLE_LABELS[role];
  }
}
