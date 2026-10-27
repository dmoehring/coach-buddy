import { Component, computed, effect, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { DashboardMetric, DashboardQuickAction, DashboardTraining } from '../dashboard.model';

import { DashboardStatCard } from '../components/dashboard-stat-card/dashboard-stat-card';
import { DashboardQuickActions } from '../components/dashboard-quick-actions/dashboard-quick-actions';
import { RecentTrainingsTable } from '../components/recent-trainings-table/recent-trainings-table';
import { BirthdaysCard } from '../components/birthdays-card/birthdays-card';
import { Birthday, findBirthdaysAround } from '../birthdays';

import { CurrentContextService } from '../../../core/context/current-context.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { TrainingParticipantsService } from '../../../api/api/training-participants.service';
import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TeamMembershipDto } from '../../../api/model/team-membership-dto';
import { AttendanceStatus } from '../../../api/model/attendance-status';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingParticipantDto } from '../../../api/model/training-participant-dto';
import { TrainingStatus } from '../../../api/model/training-status';

const RECENT_TRAININGS_LIMIT = 5;
const BIRTHDAY_WINDOW_DAYS = 7;

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  [TeamMemberRole.Player]: 'Spieler',
  [TeamMemberRole.Coach]: 'Trainer',
  [TeamMemberRole.AssistantCoach]: 'Co-Trainer'
};

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DashboardStatCard,
    DashboardQuickActions,
    RecentTrainingsTable,
    BirthdaysCard
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  readonly context = inject(CurrentContextService);
  private readonly trainingsService = inject(TrainingsService);
  private readonly trainingParticipantsService = inject(TrainingParticipantsService);
  private readonly membershipsService = inject(TeamMembershipsService);

  readonly loading = signal(false);
  readonly recentTrainings = signal<DashboardTraining[]>([]);
  readonly teamMemberships = signal<TeamMembershipDto[]>([]);

  readonly birthdayWindowDays = BIRTHDAY_WINDOW_DAYS;

  readonly birthdays = computed<Birthday[]>(() => {
    const seen = new Set<string>();
    const candidates = [];

    for (const membership of this.teamMemberships()) {
      const person = membership.person;

      if (!person?.id || !person.birthDate || seen.has(person.id)) {
        continue;
      }

      seen.add(person.id);
      candidates.push({
        personId: person.id,
        name: [person.firstName, person.lastName].filter(Boolean).join(' '),
        birthDate: person.birthDate,
        role: membership.role ? ROLE_LABELS[membership.role] : undefined
      });
    }

    return findBirthdaysAround(candidates, new Date(), BIRTHDAY_WINDOW_DAYS);
  });

  readonly metrics = computed<DashboardMetric[]>(() => {
    const season = this.context.selectedSeason();
    const team = this.context.selectedTeam();
    const lastTraining = this.recentTrainings()[0] ?? null;

    return [
      {
        label: 'Aktuelle Saison',
        value: season?.name ?? 'Keine Saison',
        description: season?.endDate ? 'abgeschlossene Saison' : 'offene Saison',
        icon: 'pi pi-flag'
      },
      {
        label: 'Aktuelles Team',
        value: team?.name ?? 'Kein Team',
        description: team?.description ?? '',
        icon: 'pi pi-users'
      },
      {
        label: 'Letztes Training',
        value: lastTraining ? `${lastTraining.present} anwesend` : 'Kein Training',
        description: lastTraining
          ? `${lastTraining.excused} entschuldigt · ${lastTraining.absent} fehlend`
          : 'Noch keine Trainings erfasst',
        icon: 'pi pi-calendar',
        route: lastTraining?.status === 'COMPLETED' && lastTraining.id
          ? `/trainings/${lastTraining.id}/attendance`
          : undefined
      }
    ];
  });

  readonly quickActions: DashboardQuickAction[] = [
    {
      label: 'Training erfassen',
      description: 'Training anlegen und Anwesenheit pflegen',
      icon: 'pi pi-plus-circle',
      route: '/trainings/new',
      primary: true
    },
    {
      label: 'Person anlegen',
      description: 'Kind, Trainer oder Kontakt erfassen',
      icon: 'pi pi-user-plus',
      route: '/persons/new'
    },
    {
      label: 'Team verwalten',
      description: 'Mitglieder und Rollen prüfen',
      icon: 'pi pi-sitemap',
      route: '/teams'
    },
    {
      label: 'Neue Saison starten',
      description: 'Saison wechseln und Teams neu aufbauen',
      icon: 'pi pi-calendar-plus',
      route: '/seasons/new'
    }
  ];

  constructor() {
    effect(() => {
      const teamId = this.context.selectedTeam()?.id;

      if (teamId) {
        this.loadRecentTrainings(teamId);
      } else {
        this.recentTrainings.set([]);
      }
    });

    effect(() => {
      const teamId = this.context.selectedTeam()?.id;

      if (teamId) {
        this.loadTeamMemberships(teamId);
      } else {
        this.teamMemberships.set([]);
      }
    });
  }

  private loadTeamMemberships(teamId: string): void {
    this.membershipsService
      .apiV1TeamMembershipsGet(true, undefined, undefined, teamId)
      .subscribe({
        next: memberships => this.teamMemberships.set(memberships),
        error: error => {
          console.error('Team memberships could not be loaded:', error);
          console.error('Backend error body:', error.error);

          this.teamMemberships.set([]);
        }
      });
  }

  private loadRecentTrainings(teamId: string): void {
    this.loading.set(true);

    this.trainingsService
      .apiV1TrainingsGet(undefined, undefined, undefined, teamId)
      .pipe(
        switchMap(trainings => {
          const recent = [...trainings]
            .sort((left, right) => (right.trainingDate ?? '').localeCompare(left.trainingDate ?? ''))
            .slice(0, RECENT_TRAININGS_LIMIT);

          if (recent.length === 0) {
            return of([]);
          }

          const requests: Observable<DashboardTraining>[] = recent.map(training =>
            this.buildDashboardTraining(training)
          );

          return forkJoin(requests);
        })
      )
      .subscribe({
        next: dashboardTrainings => {
          this.recentTrainings.set(dashboardTrainings);
          this.loading.set(false);
        },
        error: error => {
          console.error('Recent trainings could not be loaded:', error);
          console.error('Backend error body:', error.error);

          this.recentTrainings.set([]);
          this.loading.set(false);
        }
      });
  }

  private buildDashboardTraining(training: TrainingDto): Observable<DashboardTraining> {
    if (training.status !== TrainingStatus.Completed || !training.id) {
      return of(this.toDashboardTraining(training, []));
    }

    return this.trainingParticipantsService
      .apiV1TrainingParticipantsGet(undefined, undefined, training.id)
      .pipe(map(participants => this.toDashboardTraining(training, participants)));
  }

  private toDashboardTraining(
    training: TrainingDto,
    participants: TrainingParticipantDto[]
  ): DashboardTraining {
    return {
      id: training.id,
      date: this.formatDate(training.trainingDate),
      weekday: this.getWeekday(training.trainingDate),
      team: training.team?.name ?? '-',
      location: training.location ?? '-',
      status: training.status === TrainingStatus.Cancelled ? 'CANCELLED' : 'COMPLETED',
      present: this.countByStatus(participants, AttendanceStatus.Present),
      excused: this.countByStatus(participants, AttendanceStatus.Excused),
      absent: this.countByStatus(participants, AttendanceStatus.Absent)
    };
  }

  private countByStatus(participants: TrainingParticipantDto[], status: AttendanceStatus): number {
    return participants.filter(participant => participant.attendanceStatus === status).length;
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}.${month}.${year}`;
  }

  private getWeekday(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('de-DE', { weekday: 'long' });
  }
}
