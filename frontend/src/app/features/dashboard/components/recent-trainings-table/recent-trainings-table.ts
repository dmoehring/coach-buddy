import { Component, Input } from '@angular/core';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { DashboardTraining, TrainingStatus } from '../../dashboard.model';

@Component({
  selector: 'app-recent-trainings-table',
  imports: [
    CardModule,
    TableModule,
    TagModule
  ],
  templateUrl: './recent-trainings-table.html',
  styleUrl: './recent-trainings-table.scss'
})
export class RecentTrainingsTable {
  @Input({ required: true })
  trainings!: DashboardTraining[];

  getStatusLabel(status: TrainingStatus): string {
    return status === 'COMPLETED' ? 'Stattgefunden' : 'Ausgefallen';
  }

  getStatusSeverity(status: TrainingStatus): 'success' | 'danger' {
    return status === 'COMPLETED' ? 'success' : 'danger';
  }
}
