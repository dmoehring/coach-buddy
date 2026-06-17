import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

import { PersonsService } from '../../../api/api/persons.service';
import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { TeamsService } from '../../../api/api/teams.service';

import { CreateTeamMembershipRequest } from '../../../api/model/create-team-membership-request';
import { PersonDto } from '../../../api/model/person-dto';
import { TeamDto } from '../../../api/model/team-dto';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TeamMembershipDto } from '../../../api/model/team-membership-dto';

import { CurrentContextService } from '../../../core/context/current-context.service';

interface PersonOption {
  label: string;
  person: PersonDto;
}

interface RoleOption {
  label: string;
  value: TeamMemberRole;
}

@Component({
  selector: 'app-team-members-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DatePickerModule,
    SelectModule,
    TableModule
  ],
  templateUrl: './team-members-page.html',
  styleUrl: './team-members-page.scss'
})
export class TeamMembersPage {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  private readonly teamsService = inject(TeamsService);
  private readonly personsService = inject(PersonsService);
  private readonly membershipsService = inject(TeamMembershipsService);

  readonly context = inject(CurrentContextService);

  readonly teamId = this.route.snapshot.paramMap.get('id');

  readonly team = signal<TeamDto | null>(null);
  readonly persons = signal<PersonDto[]>([]);
  readonly memberships = signal<TeamMembershipDto[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly roleOptions: RoleOption[] = [
    {
      label: 'Spieler',
      value: TeamMemberRole.Player
    },
    {
      label: 'Trainer',
      value: TeamMemberRole.Coach
    },
    {
      label: 'Co-Trainer',
      value: TeamMemberRole.AssistantCoach
    }
  ];

  readonly availablePersonOptions = computed<PersonOption[]>(() => {
    const assignedPersonIds = new Set(
      this.memberships()
        .filter(membership => !membership.leftAt)
        .map(membership => membership.person?.id)
        .filter((id): id is string => Boolean(id))
    );

    return this.persons()
      .filter(person => {
        return Boolean(
          person.id &&
          !assignedPersonIds.has(person.id)
        );
      })
      .map(person => ({
        person,
        label: this.getPersonName(person)
      }))
      .sort((left, right) => {
        return left.label.localeCompare(right.label, 'de');
      });
  });

  readonly form = this.formBuilder.group({
    person: this.formBuilder.control<PersonOption | null>(
      null,
      Validators.required
    ),
    role: this.formBuilder.control<RoleOption | null>(
      this.roleOptions[0],
      Validators.required
    ),
    joinedAt: this.formBuilder.control<Date | null>(
      new Date(),
      Validators.required
    )
  });

  constructor() {
    if (
      this.route.snapshot.queryParamMap.get('created') === 'true'
    ) {
      this.success.set(
        'Das Team wurde angelegt. Weise ihm jetzt Spieler und Trainer zu.'
      );
    }

    if (!this.teamId) {
      this.error.set('Es wurde keine Team-ID übergeben.');
      this.loading.set(false);
      return;
    }

    this.loadData(this.teamId);
  }

  addMembership(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.teamId) {
      this.error.set('Die Team-ID fehlt.');
      return;
    }

    const formValue = this.form.getRawValue();

    const personOption = formValue.person;
    const roleOption = formValue.role;
    const joinedAt = formValue.joinedAt;

    if (
      !personOption?.person.id ||
      !roleOption?.value ||
      !joinedAt
    ) {
      this.error.set(
        'Person, Rolle und Eintrittsdatum müssen angegeben werden.'
      );
      return;
    }

    const personId = personOption.person.id;
    const personName = personOption.label;
    const role = roleOption.value;

    const request: CreateTeamMembershipRequest = {
      teamId: this.teamId,
      personId,
      role,
      joinedAt: this.formatApiDate(joinedAt)
    };

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    this.membershipsService
      .apiV1TeamMembershipsPost(request)
      .pipe(
        switchMap(() => {
          return this.membershipsService.apiV1TeamMembershipsGet(
            undefined,
            undefined,
            undefined,
            this.teamId!
          );
        })
      )
      .subscribe({
        next: memberships => {
          this.memberships.set(memberships);
          this.saving.set(false);

          this.success.set(
            `${personName} wurde dem Team zugewiesen.`
          );

          this.form.reset({
            person: null,
            role: this.roleOptions[0],
            joinedAt: new Date()
          });
        },
        error: error => {
          console.error(
            'Team membership could not be created:',
            error
          );
          console.error(
            'Backend error body:',
            error.error
          );

          this.error.set(
            'Die Person konnte dem Team nicht zugewiesen werden.'
          );
          this.saving.set(false);
        }
      });
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

  getMembershipPersonName(
    membership: TeamMembershipDto
  ): string {
    return this.getPersonName(membership.person);
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

  isActive(membership: TeamMembershipDto): boolean {
    return !membership.leftAt;
  }

  formatDisplayDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}.${month}.${year}`;
  }

  private loadData(teamId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      team: this.teamsService.apiV1TeamsIdGet(teamId),
      persons: this.personsService.apiV1PersonsGet(),
      memberships:
        this.membershipsService.apiV1TeamMembershipsGet(
          undefined,
          undefined,
          undefined,
          teamId
        )
    }).subscribe({
      next: result => {
        this.team.set(result.team);
        this.persons.set(result.persons);
        this.memberships.set(result.memberships);

        this.context.selectTeam(result.team);

        this.loading.set(false);
      },
      error: error => {
        console.error(
          'Team member data could not be loaded:',
          error
        );
        console.error(
          'Backend error body:',
          error.error
        );

        this.error.set(
          'Das Team und die verfügbaren Personen konnten nicht geladen werden.'
        );
        this.loading.set(false);
      }
    });
  }

  private formatApiDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
