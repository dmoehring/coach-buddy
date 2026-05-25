import { Component } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

type TrainingStatus = 'COMPLETED' | 'CANCELLED';

interface DashboardTraining {
  date: string;
  team: string;
  location: string;
  status: TrainingStatus;
  present: number;
  excused: number;
  absent: number;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CardModule,
    ButtonModule,
    TagModule,
    TableModule
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  readonly trainings: DashboardTraining[] = [
    {
      date: '2026-05-24',
      team: 'Minis',
      location: 'Realschulhalle',
      status: 'COMPLETED',
      present: 18,
      excused: 3,
      absent: 2
    },
    {
      date: '2026-05-17',
      team: 'Minis',
      location: 'Realschulhalle',
      status: 'COMPLETED',
      present: 15,
      excused: 1,
      absent: 4
    },
    {
      date: '2026-05-10',
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
