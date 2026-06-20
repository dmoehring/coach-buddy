import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { TeamsService } from '../../../api/api/teams.service';

import { PersonDto } from '../../../api/model/person-dto';
import { TeamDto } from '../../../api/model/team-dto';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TeamMembershipDto } from '../../../api/model/team-membership-dto';

import { CurrentContextService } from '../../../core/context/current-context.service';

@Component({
  selector: 'app-team-detail-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TableModule
  ],
  templateUrl: './team-detail-page.html',
  styleUrl: './team-detail-page.scss'
})
export class TeamDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly teamsService = inject(TeamsService);
  private readonly membershipsService = inject(TeamMembershipsService);

  readonly context = inject(CurrentContextService);

  readonly teamId = this.route.snapshot.paramMap.get('id');

  readonly team = signal<TeamDto | null>(null);
  readonly memberships = signal<TeamMembershipDto[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeMemberships = computed(() =>
    this.memberships().filter(membership => !membership.leftAt)
  );

  readonly playerCount = computed(() =>
    this.activeMemberships().filter(
      membership => membership.role === TeamMemberRole.Player
    ).length
  );

  readonly coachCount = computed(() =>
    this.activeMemberships().filter(
      membership =>
        membership.role === TeamMemberRole.Coach ||
        membership.role === TeamMemberRole.AssistantCoach
    ).length
  );

  constructor() {
    if (!this.teamId) {
      this.error.set('Es wurde keine Team-ID übergeben.');
      this.loading.set(false);
      return;
    }

    this.loadTeam(this.teamId);
  }

  getPersonName(person?: PersonDto): string {
    if (!person) {
      return 'Unbekannte Person';
    }

    const fullName = [
      person.firstName,
      person.lastName
    ]
      .filter(Boolean)
      .join(' ');

    return fullName || person.nickname || 'Person ohne Namen';
  }

  getRoleLabel(role?: TeamMemberRole): string {
    switch (role) {
      case TeamMemberRole.Player:
        return 'Spieler';

      case TeamMemberRole.Coach:
        return 'Trainer';

      case TeamMemberRole.AssistantCoach:
        return 'Co-Trainer';

      default:
        return 'Keine Rolle';
    }
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}.${month}.${year}`;
  }

  private loadTeam(teamId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      team: this.teamsService.apiV1TeamsIdGet(teamId),
      memberships: this.membershipsService.apiV1TeamMembershipsGet(
        undefined,
        undefined,
        undefined,
        teamId
      )
    }).subscribe({
      next: result => {
        this.team.set(result.team);
        this.memberships.set(result.memberships);

        this.context.selectTeam(result.team);

        this.loading.set(false);
      },
      error: error => {
        console.error('Team could not be loaded:', error);
        console.error('Backend error body:', error.error);

        this.error.set('Die Mannschaft konnte nicht geladen werden.');
        this.loading.set(false);
      }
    });
  }
}
