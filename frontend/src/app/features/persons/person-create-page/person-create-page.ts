import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { ButtonModule } from 'primeng/button';

import { PersonRelationsService } from '../../../api/api/person-relations.service';
import { PersonsService } from '../../../api/api/persons.service';
import { CreatePersonRequest } from '../../../api/model/create-person-request';
import { PersonDto } from '../../../api/model/person-dto';
import { PersonForm, PersonFormValue } from '../components/person-form/person-form';
import { PersonRelationsDraft, RelationDraft } from '../components/person-relations-draft/person-relations-draft';

@Component({
  selector: 'app-person-create-page',
  imports: [
    RouterLink,
    ButtonModule,
    PersonForm,
    PersonRelationsDraft
  ],
  templateUrl: './person-create-page.html',
  styleUrl: './person-create-page.scss'
})
export class PersonCreatePage implements OnInit {
  private readonly personsService = inject(PersonsService);
  private readonly personRelationsService = inject(PersonRelationsService);
  private readonly router = inject(Router);

  // Set once the person exists, so a retry after a failed relation only creates the missing relations.
  private createdPerson: PersonDto | null = null;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly existingPersons = signal<PersonDto[]>([]);
  readonly relationDrafts = signal<RelationDraft[]>([]);

  ngOnInit(): void {
    this.personsService.apiV1PersonsGet().subscribe({
      next: persons => this.existingPersons.set(persons),
      error: error => {
        console.error('Persons could not be loaded:', error);
        console.error('Backend error body:', error.error);
      }
    });
  }

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

    const person$: Observable<PersonDto> = this.createdPerson
      ? of(this.createdPerson)
      : this.personsService.apiV1PersonsPost(request).pipe(
          tap(person => {
            this.createdPerson = person;
          })
        );

    person$.pipe(switchMap(person => this.createRelations(person))).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/persons']);
      },
      error: error => {
        console.error('Person could not be created:', error);
        console.error('Backend error body:', error.error);
        this.error.set(
          this.createdPerson
            ? 'Die Person wurde angelegt, aber nicht alle Beziehungen konnten gespeichert werden. Bitte erneut speichern.'
            : 'Person konnte nicht angelegt werden.'
        );
        this.saving.set(false);
      }
    });
  }

  private createRelations(person: PersonDto): Observable<unknown> {
    const drafts = this.relationDrafts();

    if (drafts.length === 0) {
      return of(null);
    }

    return forkJoin(
      drafts.map(draft =>
        this.personRelationsService
          .apiV1PersonRelationsPost({
            childPersonId: draft.role === 'CHILD' ? person.id : draft.otherPerson.id,
            guardianPersonId: draft.role === 'CHILD' ? draft.otherPerson.id : person.id,
            relationType: draft.relationType.value
          })
          .pipe(
            tap(() =>
              this.relationDrafts.update(current => current.filter(candidate => candidate !== draft))
            ),
            map(() => true),
            // Let every request finish, so a single failure does not cancel the others mid-flight.
            catchError(error => {
              console.error('Person relation could not be created:', error);
              console.error('Backend error body:', error.error);

              return of(false);
            })
          )
      )
    ).pipe(
      tap(results => {
        if (results.includes(false)) {
          throw new Error('Not all person relations could be created.');
        }
      })
    );
  }
}
