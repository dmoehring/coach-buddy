import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

import { PersonRelationsService } from '../../../api/api/person-relations.service';
import { PersonsService } from '../../../api/api/persons.service';
import { TeamMembershipsService } from '../../../api/api/team-memberships.service';

import { PersonDto } from '../../../api/model/person-dto';
import { PersonRelationDto } from '../../../api/model/person-relation-dto';
import { PhoneType } from '../../../api/model/phone-type';
import { RelationType } from '../../../api/model/relation-type';
import { TeamMemberRole } from '../../../api/model/team-member-role';
import { TeamMembershipDto } from '../../../api/model/team-membership-dto';

interface ContactEntry {
  label: string;
  number: string;
  tel: string;
}

@Component({
  selector: 'app-person-detail-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TableModule
  ],
  templateUrl: './person-detail-page.html',
  styleUrl: './person-detail-page.scss'
})
export class PersonDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly personsService = inject(PersonsService);
  private readonly personRelationsService = inject(PersonRelationsService);
  private readonly membershipsService = inject(TeamMembershipsService);

  readonly personId = this.route.snapshot.paramMap.get('id');
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/persons';

  readonly person = signal<PersonDto | null>(null);
  readonly guardianRelations = signal<PersonRelationDto[]>([]);
  readonly childRelations = signal<PersonRelationDto[]>([]);
  readonly memberships = signal<TeamMembershipDto[]>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    if (!this.personId) {
      this.error.set('Es wurde keine Personen-ID übergeben.');
      this.loading.set(false);
      return;
    }

    this.loadPerson(this.personId);
  }

  getPersonName(person?: PersonDto | null): string {
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

  getContactEntries(person?: PersonDto | null): ContactEntry[] {
    if (!person) {
      return [];
    }

    return (person.phoneNumbers ?? []).map(phoneNumber =>
      this.toContactEntry(
        this.getPhoneTypeLabel(phoneNumber.type),
        phoneNumber.number
      )
    );
  }

  getPhoneTypeLabel(type?: PhoneType): string {
    switch (type) {
      case PhoneType.Mobile:
        return 'Mobil';

      case PhoneType.Home:
        return 'Privat';

      case PhoneType.Work:
        return 'Arbeit';

      case PhoneType.Emergency:
        return 'Notfall';

      default:
        return 'Telefon';
    }
  }

  getRelationTypeLabel(type?: RelationType): string {
    switch (type) {
      case RelationType.Mother:
        return 'Mutter';

      case RelationType.Father:
        return 'Vater';

      case RelationType.Grandmother:
        return 'Großmutter';

      case RelationType.Grandfather:
        return 'Großvater';

      case RelationType.StepParent:
        return 'Stiefelternteil';

      default:
        return 'Kontakt';
    }
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

  private toContactEntry(label: string, number?: string): ContactEntry {
    const value = number ?? '';

    return {
      label,
      number: value,
      tel: value.replace(/[^+\d]/g, '')
    };
  }

  private loadPerson(personId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      person: this.personsService.apiV1PersonsIdGet(personId),
      guardianRelations: this.personRelationsService.apiV1PersonRelationsGet(
        personId,
        undefined
      ),
      childRelations: this.personRelationsService.apiV1PersonRelationsGet(
        undefined,
        personId
      ),
      memberships: this.membershipsService.apiV1TeamMembershipsGet(
        undefined,
        personId,
        undefined,
        undefined
      )
    }).subscribe({
      next: result => {
        this.person.set(result.person);
        this.guardianRelations.set(result.guardianRelations);
        this.childRelations.set(result.childRelations);
        this.memberships.set(result.memberships);

        this.loading.set(false);
      },
      error: error => {
        console.error('Person could not be loaded:', error);
        console.error('Backend error body:', error.error);

        this.error.set('Die Person konnte nicht geladen werden.');
        this.loading.set(false);
      }
    });
  }
}
