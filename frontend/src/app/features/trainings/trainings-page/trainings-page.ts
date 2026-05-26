import { Component } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

type TrainingStatus = 'COMPLETED' | 'CANCELLED';

interface TrainingOverview {
  id: string;
  trainingDate: string;
  weekday: string;
  teamName: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status: TrainingStatus;
  notes?: string;
}

@Component({
  selector: 'app-trainings-page',
  imports: [
    ButtonModule,
    CardModule,
    TableModule,
    TagModule
  ],
  templateUrl: './trainings-page.html',
  styleUrl: './trainings-page.scss'
})
export class TrainingsPage {

  readonly trainings: TrainingOverview[] = [
    {
      id: '1',
      trainingDate: '24.05.2026',
      weekday: 'Sonntag',
      teamName: 'Minis',
      startTime: '10:00',
      endTime: '11:30',
      location: 'Realschulhalle',
      status: 'COMPLETED',
      notes: 'Gutes Training mit Schwerpunkt Prellen.'
    },
    {
      id: '2',
      trainingDate: '17.05.2026',
      weekday: 'Sonntag',
      teamName: 'Minis',
      startTime: '10:00',
      endTime: '11:30',
      location: 'Realschulhalle',
      status: 'COMPLETED'
    },
    {
      id: '3',
      trainingDate: '10.05.2026',
      weekday: 'Sonntag',
      teamName: 'Minis',
      location: 'Beethovenhalle',
      status: 'CANCELLED',
      notes: 'Training ist wegen Hallensperrung ausgefallen.'
    }
  ];

  getStatusLabel(status: TrainingStatus): string {
    return status === 'COMPLETED' ? 'Stattgefunden' : 'Ausgefallen';
  }

  getStatusSeverity(status: TrainingStatus): 'success' | 'danger' {
    return status === 'COMPLETED' ? 'success' : 'danger';
  }

  getTimeRange(training: TrainingOverview): string {
    if (!training.startTime && !training.endTime) {
      return '-';
    }

    if (training.startTime && training.endTime) {
      return `${training.startTime} - ${training.endTime}`;
    }

    return training.startTime ?? training.endTime ?? '-';
  }
}
