import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';

import { DashboardQuickAction } from '../../dashboard.model';

@Component({
  selector: 'app-dashboard-quick-actions',
  imports: [
    RouterLink,
    CardModule
  ],
  templateUrl: './dashboard-quick-actions.html',
  styleUrl: './dashboard-quick-actions.scss'
})
export class DashboardQuickActions {
  @Input({ required: true })
  actions!: DashboardQuickAction[];
}
