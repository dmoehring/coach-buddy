import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { PersonsService } from '../../../api/api/persons.service';
import { TeamMembershipsService } from '../../../api/api/team-memberships.service';
import { PersonDto } from '../../../api/model/person-dto';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TeamMembershipDto } from '../../../api/model/team-membership-dto';
import { CurrentContextService } from '../../../core/context/current-context.service';

const NO_TEAM = '__none__';

interface PersonMembership {
  teamId: string;
  teamName: string;
  role?: TeamMemberRole;
}

interface PersonRow {
  person: PersonDto;
  fullName: string;
  birthDate: string;
  birthYear: number | null;
  age: number | null;
  memberships: PersonMembership[];
}

interface FilterOption<T> {
  label: string;
  value: T;
}

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  [TeamMemberRole.Player]: 'Spieler',
  [TeamMemberRole.Coach]: 'Trainer',
  [TeamMemberRole.AssistantCoach]: 'Co-Trainer'
};

@Component({
  selector: 'app-persons-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule
  ],
  templateUrl: './persons-page.html',
  styleUrl: './persons-page.scss'
})
export class PersonsPage implements OnInit {
  private readonly personsService = inject(PersonsService);
  private readonly membershipsService = inject(TeamMembershipsService);

  readonly context = inject(CurrentContextService);

  readonly persons = signal<PersonDto[]>([]);
  readonly memberships = signal<TeamMembershipDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly teamFilter = signal<string | null>(null);
  readonly roleFilter = signal<TeamMemberRole | null>(null);
  readonly birthYearFilter = signal<number | null>(null);

  readonly roleOptions: FilterOption<TeamMemberRole | null>[] = [
    { label: 'Alle Rollen', value: null },
    { label: ROLE_LABELS[TeamMemberRole.Player], value: TeamMemberRole.Player },
    { label: ROLE_LABELS[TeamMemberRole.Coach], value: TeamMemberRole.Coach },
    { label: ROLE_LABELS[TeamMemberRole.AssistantCoach], value: TeamMemberRole.AssistantCoach }
  ];

  readonly teamOptions = computed<FilterOption<string | null>[]>(() => [
    { label: 'Alle Personen', value: null },
    ...this.context.teamsForSelectedSeason()
      .filter(team => team.id)
      .map(team => ({ label: team.name ?? 'Team ohne Namen', value: team.id as string })),
    { label: 'Ohne Mannschaft', value: NO_TEAM }
  ]);

  /** Aktive Mitgliedschaften gruppiert nach Person – nur für die ausgewählte Saison. */
  private readonly membershipsByPerson = computed(() => {
    const seasonId = this.context.selectedSeason()?.id;
    const result = new Map<string, PersonMembership[]>();

    for (const membership of this.memberships()) {
      const personId = membership.person?.id;
      const team = membership.team;

      if (!personId || !team?.id || team.seasonId !== seasonId) {
        continue;
      }

      const entries = result.get(personId) ?? [];
      entries.push({
        teamId: team.id,
        teamName: team.name ?? 'Team ohne Namen',
        role: membership.role
      });
      result.set(personId, entries);
    }

    return result;
  });

  readonly rows = computed<PersonRow[]>(() => {
    const membershipsByPerson = this.membershipsByPerson();

    return this.persons()
      .map(person => ({
        person,
        fullName: this.getFullName(person),
        birthDate: person.birthDate?.slice(0, 10) ?? '',
        birthYear: this.parseBirthYear(person.birthDate),
        age: this.calculateAge(person.birthDate),
        memberships: (person.id && membershipsByPerson.get(person.id)) || []
      }))
      .sort((left, right) => left.fullName.localeCompare(right.fullName, 'de'));
  });

  readonly birthYearOptions = computed<FilterOption<number | null>[]>(() => {
    const years = new Set<number>();

    for (const row of this.rows()) {
      if (row.birthYear !== null) {
        years.add(row.birthYear);
      }
    }

    return [
      { label: 'Alle Jahrgänge', value: null },
      ...[...years].sort((left, right) => right - left).map(year => ({ label: `${year}`, value: year }))
    ];
  });

  readonly filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase('de');
    const teamFilter = this.teamFilter();
    const roleFilter = this.roleFilter();
    const birthYear = this.birthYearFilter();

    return this.rows().filter(row => {
      if (term && !this.matchesSearch(row, term)) {
        return false;
      }

      if (birthYear !== null && row.birthYear !== birthYear) {
        return false;
      }

      if (teamFilter === NO_TEAM) {
        return row.memberships.length === 0;
      }

      if (teamFilter || roleFilter) {
        return row.memberships.some(membership =>
          (!teamFilter || membership.teamId === teamFilter)
          && (!roleFilter || membership.role === roleFilter)
        );
      }

      return true;
    });
  });

  readonly roleFilterDisabled = computed(() => this.teamFilter() === NO_TEAM);

  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.searchTerm().trim()
      || this.teamFilter()
      || this.roleFilter()
      || this.birthYearFilter() !== null
    )
  );

  ngOnInit(): void {
    this.loadPersons();
  }

  loadPersons(): void {
    this.loading.set(true);
    this.error.set(null);

    this.personsService.apiV1PersonsGet().subscribe({
      next: persons => {
        this.persons.set(persons);
        this.loading.set(false);
      },
      error: error => {
        console.error('Persons could not be loaded:', error);
        this.error.set('Personen konnten nicht geladen werden.');
        this.loading.set(false);
      }
    });

    // Mitgliedschaften sind nur für Teamfilter/-anzeige nötig; ohne sie bleibt die Liste benutzbar.
    this.membershipsService.apiV1TeamMembershipsGet(true).subscribe({
      next: memberships => this.memberships.set(memberships),
      error: error => {
        console.error('Team memberships could not be loaded:', error);
        this.memberships.set([]);
      }
    });
  }

  setTeamFilter(value: string | null): void {
    this.teamFilter.set(value);

    if (value === NO_TEAM) {
      this.roleFilter.set(null);
    }
  }


  resetFilters(): void {
    this.searchTerm.set('');
    this.teamFilter.set(null);
    this.roleFilter.set(null);
    this.birthYearFilter.set(null);
  }

  getRoleLabel(role?: TeamMemberRole): string {
    return role ? ROLE_LABELS[role] : '';
  }

  formatBirthDate(birthDate?: string): string {
    if (!birthDate) {
      return '-';
    }

    const [year, month, day] = birthDate.slice(0, 10).split('-');

    if (!year || !month || !day) {
      return birthDate;
    }

    return `${day}.${month}.${year}`;
  }

  getFullName(person: PersonDto): string {
    return [person.firstName, person.lastName]
      .filter(Boolean)
      .join(' ');
  }

  private matchesSearch(row: PersonRow, term: string): boolean {
    const haystack = [row.fullName, row.person.nickname, row.person.notes]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('de');

    return haystack.includes(term);
  }

  private parseBirthYear(birthDate?: string): number | null {
    const year = Number(birthDate?.slice(0, 4));

    return Number.isInteger(year) && year > 0 ? year : null;
  }

  private calculateAge(birthDate?: string): number | null {
    if (!birthDate) {
      return null;
    }

    const [year, month, day] = birthDate.slice(0, 10).split('-').map(Number);

    if (!year || !month || !day) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - year;

    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
      age--;
    }

    return age >= 0 ? age : null;
  }
}
