import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { PersonsService } from '../../../api/api/persons.service';
import { PersonDto } from '../../../api/model/person-dto';
import { UpdatePersonRequest } from '../../../api/model/update-person-request';
import { PersonForm, PersonFormValue } from '../components/person-form/person-form';

@Component({
  selector: 'app-person-edit-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    PersonForm
  ],
  templateUrl: './person-edit-page.html',
  styleUrl: './person-edit-page.scss'
})
export class PersonEditPage implements OnInit {
  private readonly personsService = inject(PersonsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private personId = '';

  readonly initialValue = signal<PersonFormValue | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Keine Personen-ID in der Route gefunden.');
      return;
    }

    this.personId = id;
    this.loadPerson(id);
  }

  savePerson(value: PersonFormValue): void {
    if (!this.personId) {
      this.error.set('Person kann ohne ID nicht gespeichert werden.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const request: UpdatePersonRequest = {
      firstName: value.firstName,
      lastName: value.lastName,
      birthDate: value.birthDate,
      nickname: value.nickname,
      notes: value.notes
    };

    this.personsService.apiV1PersonsIdPut(this.personId, request).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/persons']);
      },
      error: error => {
        console.error('Person could not be updated:', error);
        console.error('Backend error body:', error.error);
        this.error.set('Person konnte nicht gespeichert werden.');
        this.saving.set(false);
      }
    });
  }

  private loadPerson(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.personsService.apiV1PersonsIdGet(id).subscribe({
      next: person => {
        this.initialValue.set(this.toFormValue(person));
        this.loading.set(false);
      },
      error: error => {
        console.error('Person could not be loaded:', error);
        console.error('Backend error body:', error.error);
        this.error.set('Person konnte nicht geladen werden.');
        this.loading.set(false);
      }
    });
  }

  private toFormValue(person: PersonDto): PersonFormValue {
    return {
      firstName: person.firstName ?? '',
      lastName: person.lastName ?? '',
      birthDate: person.birthDate,
      nickname: person.nickname,
      notes: person.notes
    };
  }
}
