import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

import { PersonsService } from '../../../api/api/persons.service';
import { PersonDto } from '../../../api/model/person-dto';

@Component({
  selector: 'app-persons-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TableModule
  ],
  templateUrl: './persons-page.html',
  styleUrl: './persons-page.scss'
})
export class PersonsPage implements OnInit {
  private readonly personsService = inject(PersonsService);

  readonly persons = signal<PersonDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
}
