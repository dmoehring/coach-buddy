import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { PersonsService } from '../../../api/api/persons.service';
import { CreatePersonRequest } from '../../../api/model/create-person-request';
import { PersonForm, PersonFormValue } from '../components/person-form/person-form';

@Component({
  selector: 'app-person-create-page',
  imports: [
    RouterLink,
    ButtonModule,
    PersonForm
  ],
  templateUrl: './person-create-page.html',
  styleUrl: './person-create-page.scss'
})
export class PersonCreatePage {
  private readonly personsService = inject(PersonsService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  createPerson(value: PersonFormValue): void {
    this.saving.set(true);
    this.error.set(null);

    const request: CreatePersonRequest = {
      firstName: value.firstName,
      lastName: value.lastName,
      birthDate: value.birthDate,
      nickname: value.nickname,
      notes: value.notes,
      phoneNumbers: value.phoneNumbers
    };

    this.personsService.apiV1PersonsPost(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/persons']);
      },
      error: error => {
        console.error('Person could not be created:', error);
        console.error('Backend error body:', error.error);
        this.error.set('Person konnte nicht angelegt werden.');
        this.saving.set(false);
      }
    });
  }
}
