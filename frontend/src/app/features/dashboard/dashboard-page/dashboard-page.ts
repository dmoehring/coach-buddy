import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';

import { Birthday, findBirthdaysAround } from '../birthdays';
import { CurrentContextService } from '../../../core/context/current-context.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { TrainingParticipantsService } from '../../../api/api/training-participants.service';
import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { AttendanceStatus } from '../../../api/model/attendance-status';
import { TeamMembershipDto } from '../../../api/model/team-membership-dto';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingStatus } from '../../../api/model/training-status';
import { TrainingType } from '../../../api/model/training-type';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CsvExportService } from '../../../shared/util/export.service';
import {
  ROLE_LABELS,
  formatShortDate,
  isGameDay,
  personName,
  timeRange,
  trainingLink,
  trainingTitle
} from '../../../shared/util/format';

const RECENT_TRAININGS_LIMIT = 5;
const BIRTHDAY_WINDOW_DAYS = 7;

interface RecentTraining {
  training: TrainingDto;
  present: number | null;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, ButtonModule, PageHeader],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  readonly context = inject(CurrentContextService);
  readonly csv = inject(CsvExportService);
  private readonly trainingsService = inject(TrainingsService);
  private readonly participantsService = inject(TrainingParticipantsService);
  private readonly membershipsService = inject(TeamMembershipsService);

  readonly TrainingType = TrainingType;
  readonly birthdayWindowDays = BIRTHDAY_WINDOW_DAYS;

  readonly loading = signal(false);
  readonly recent = signal<RecentTraining[]>([]);
  readonly memberships = signal<TeamMembershipDto[]>([]);

  readonly playerCount = computed(() =>
    this.memberships().filter(membership => membership.role === 'PLAYER').length
  );

  readonly birthdays = computed<Birthday[]>(() => {
    const seen = new Set<string>();
    const candidates = [];

    for (const membership of this.memberships()) {
      const person = membership.person;

      if (!person?.id || !person.birthDate || seen.has(person.id)) {
        continue;
      }

      seen.add(person.id);
      candidates.push({
        personId: person.id,
        name: personName(person),
        birthDate: person.birthDate,
        role: membership.role ? ROLE_LABELS[membership.role] : undefined
      });
    }

    return findBirthdaysAround(candidates, new Date(), BIRTHDAY_WINDOW_DAYS);
  });

  constructor() {
    effect(() => {
      const teamId = this.context.selectedTeam()?.id;

      if (teamId) {
        this.loadRecent(teamId);
        this.loadMemberships(teamId);
      } else {
        this.recent.set([]);
        this.memberships.set([]);
      }
    });
  }

  exportMembers(): void {
    const teamId = this.context.selectedTeam()?.id;

    if (teamId) {
      this.csv.members(teamId);
    }
  }

  link(training: TrainingDto): string[] {
    return trainingLink(training);
  }

  title(training: TrainingDto): string {
    return trainingTitle(training);
  }

  isGameDay(training: TrainingDto): boolean {
    return isGameDay(training);
  }

  isCancelled(training: TrainingDto): boolean {
    return training.status === TrainingStatus.Cancelled;
  }

  when(training: TrainingDto): string {
    return [formatShortDate(training.trainingDate), timeRange(training.startTime, training.endTime)]
      .filter(Boolean)
      .join(' · ');
  }

  relativeLabel(birthday: Birthday): string {
    const days = birthday.daysFromToday;

    if (days === 0) {
      return 'Heute';
    }

    if (days === 1) {
      return 'Morgen';
    }

    if (days === -1) {
      return 'Gestern';
    }

    return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`;
  }

  birthdayDate(birthday: Birthday): string {
    return birthday.date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  private loadMemberships(teamId: string): void {
    this.membershipsService
      .apiV1TeamMembershipsGet(true, undefined, undefined, teamId)
      .subscribe({
        next: memberships => this.memberships.set(memberships),
        error: error => {
          console.error('Team memberships could not be loaded:', error);
          this.memberships.set([]);
        }
      });
  }

  private loadRecent(teamId: string): void {
    this.loading.set(true);

    this.trainingsService
      .apiV1TrainingsGet(undefined, undefined, undefined, teamId)
      .pipe(
        switchMap(trainings => {
          const recent = [...trainings]
            .sort((left, right) => (right.trainingDate ?? '').localeCompare(left.trainingDate ?? ''))
            .slice(0, RECENT_TRAININGS_LIMIT);

          if (recent.length === 0) {
            return of([] as RecentTraining[]);
          }

          return forkJoin(recent.map(training => this.withAttendance(training)));
        })
      )
      .subscribe({
        next: recent => {
          this.recent.set(recent);
          this.loading.set(false);
        },
        error: error => {
          console.error('Recent trainings could not be loaded:', error);
          this.recent.set([]);
          this.loading.set(false);
        }
      });
  }

  private withAttendance(training: TrainingDto): Observable<RecentTraining> {
    if (training.status !== TrainingStatus.Completed || !training.id) {
      return of({ training, present: null });
    }

    return this.participantsService
      .apiV1TrainingParticipantsGet(undefined, undefined, training.id)
      .pipe(
        map(participants => ({
          training,
          present: participants.filter(participant => participant.attendanceStatus === AttendanceStatus.Present).length
        }))
      );
  }
}
