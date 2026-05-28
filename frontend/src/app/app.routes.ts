import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PersonsPage } from './features/persons/persons-page/persons-page';
import { TeamsPage } from './features/teams/teams-page/teams-page';
import { TrainingsPage } from './features/trainings/trainings-page/trainings-page';
import { TrainingFormPage } from './features/trainings/training-form-page/training-form-page';
import {TrainingAttendancePage} from './features/trainings/training-attendance-page/training-attendance-page';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'persons', component: PersonsPage },
      { path: 'teams', component: TeamsPage },
      { path: 'trainings/new', component: TrainingFormPage },
      { path: 'trainings/:id/attendance', component: TrainingAttendancePage },
      { path: 'trainings', component: TrainingsPage },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
