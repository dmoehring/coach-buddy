import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PersonsPage } from './features/persons/persons-page/persons-page';
import { TeamsPage } from './features/teams/teams-page/teams-page';
import { TrainingsPage } from './features/trainings/trainings-page/trainings-page';
import { TrainingFormPage } from './features/trainings/training-form-page/training-form-page';
import {TrainingAttendancePage} from './features/trainings/training-attendance-page/training-attendance-page';
import {PersonCreatePage} from './features/persons/person-create-page/person-create-page';
import {PersonEditPage} from './features/persons/person-edit-page/person-edit-page';
import {TeamCreatePage} from './features/teams/team-create-page/team-create-page';
import {TeamMembersPage} from './features/teams/team-members-page/team-members-page';
import {TeamDetailPage} from './features/teams/team-detail-page/team-detail-page';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'persons', component: PersonsPage },
      { path: 'persons/new', component: PersonCreatePage },
      { path: 'persons/:id/edit', component: PersonEditPage },
      { path: 'teams', component: TeamsPage },
      { path: 'teams/new', component: TeamCreatePage },
      { path: 'teams/:id/members', component: TeamMembersPage},
      { path: 'teams/:id', component: TeamDetailPage },
      { path: 'trainings/new', component: TrainingFormPage },
      { path: 'trainings/:id/attendance', component: TrainingAttendancePage },
      { path: 'trainings', component: TrainingsPage },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
