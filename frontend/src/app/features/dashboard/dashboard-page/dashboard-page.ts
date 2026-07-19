import { Component, computed, effect, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { DashboardMetric, DashboardQuickAction, DashboardTraining } from '../dashboard.model';

import { DashboardStatCard } from '../components/dashboard-stat-card/dashboard-stat-card';
import { DashboardQuickActions } from '../components/dashboard-quick-actions/dashboard-quick-actions';
import { RecentTrainingsTable } from '../components/recent-trainings-table/recent-trainings-table';

import { CurrentContextService } from '../../../core/context/current-context.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { TrainingParticipantsService } from '../../../api/api/training-participants.service';
import { AttendanceStatus } from '../../../api/model/attendance-status';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingParticipantDto } from '../../../api/model/training-participant-dto';
import { TrainingStatus } from '../../../api/model/training-status';

const RECENT_TRAININGS_LIMIT = 5;

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DashboardStatCard,
    DashboardQuickActions,
    RecentTrainingsTable
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  private readonly context = inject(CurrentContextService);
  private readonly trainingsService = inject(TrainingsService);
  private readonly trainingParticipantsService = inject(TrainingParticipantsService);

  readonly loading = signal(false);
  readonly recentTrainings = signal<DashboardTraining[]>([]);

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
        icon: 'pi pi-calendar'
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
