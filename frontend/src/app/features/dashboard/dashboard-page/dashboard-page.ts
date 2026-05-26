import { Component } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

import { DashboardMetric, DashboardTraining, TrainingStatus } from '../dashboard.model';
import { DashboardStatCard } from '../components/dashboard-stat-card/dashboard-stat-card';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    ButtonModule,
    CardModule,
    TagModule,
    TableModule,
    DashboardStatCard
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {

  readonly currentSeason = '2025/2026';
  readonly currentTeam = 'Minis';
  readonly currentTeamDescription = 'Jahrgänge 2017–2019';

  readonly lastTrainingSummary = {
    present: 18,
    excused: 3,
    absent: 2
  };

  readonly metrics: DashboardMetric[] = [
    {
      label: 'Aktuelle Saison',
      value: this.currentSeason,
      description: 'offene Saison',
      icon: 'pi pi-flag'
    },
    {
      label: 'Aktuelles Team',
      value: this.currentTeam,
      description: this.currentTeamDescription,
      icon: 'pi pi-users'
    },
    {
      label: 'Letztes Training',
      value: `${this.lastTrainingSummary.present} anwesend`,
      description: `${this.lastTrainingSummary.excused} entschuldigt · ${this.lastTrainingSummary.absent} fehlend`,
      icon: 'pi pi-calendar'
    }
  ];

  readonly trainings: DashboardTraining[] = [
    {
      date: '24.05.2026',
      weekday: 'Sonntag',
      team: 'Minis',
      location: 'Realschulhalle',
      status: 'COMPLETED',
      present: 18,
      excused: 3,
      absent: 2
    },
    {
      date: '17.05.2026',
      weekday: 'Sonntag',
      team: 'Minis',
      location: 'Realschulhalle',
      status: 'COMPLETED',
      present: 15,
      excused: 1,
      absent: 4
    },
    {
      date: '10.05.2026',
      weekday: 'Sonntag',
      team: 'Minis',
      location: 'Beethovenhalle',
      status: 'CANCELLED',
      present: 0,
      excused: 0,
      absent: 0
    }
  ];

  getStatusLabel(status: TrainingStatus): string {
    return status === 'COMPLETED' ? 'Stattgefunden' : 'Ausgefallen';
  }

  getStatusSeverity(status: TrainingStatus): 'success' | 'danger' {
    return status === 'COMPLETED' ? 'success' : 'danger';
  }
}
