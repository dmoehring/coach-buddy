import { Component, Input } from '@angular/core';

import { CardModule } from 'primeng/card';

import { DashboardMetric } from '../../dashboard.model';

@Component({
  selector: 'app-dashboard-stat-card',
  imports: [
    CardModule
  ],
  templateUrl: './dashboard-stat-card.html',
  styleUrl: './dashboard-stat-card.scss'
})
export class DashboardStatCard {
  @Input({ required: true })
  metric!: DashboardMetric;
}
