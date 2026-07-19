import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

import { PersonsService } from '../../../api/api/persons.service';
import { PersonRelationsService } from '../../../api/api/person-relations.service';
import { PersonDto } from '../../../api/model/person-dto';
import { PersonRelationDto } from '../../../api/model/person-relation-dto';
import { RelationType } from '../../../api/model/relation-type';
import { UpdatePersonRequest } from '../../../api/model/update-person-request';
import { PersonForm, PersonFormValue } from '../components/person-form/person-form';

type RelationRole = 'CHILD' | 'GUARDIAN';

interface PersonOption {
  label: string;
  person: PersonDto;
}

interface RelationTypeOption {
  label: string;
  value: RelationType;
}

@Component({
  selector: 'app-person-edit-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    SelectModule,
    PersonForm
  ],
  templateUrl: './person-edit-page.html',
  styleUrl: './person-edit-page.scss'
})
export class PersonEditPage implements OnInit {
  private readonly personsService = inject(PersonsService);
  private readonly personRelationsService = inject(PersonRelationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  private personId = '';

  readonly initialValue = signal<PersonFormValue | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly allPersons = signal<PersonDto[]>([]);
  readonly guardianRelations = signal<PersonRelationDto[]>([]);
  readonly childRelations = signal<PersonRelationDto[]>([]);

  readonly relationsLoading = signal(false);
  readonly relationsSaving = signal(false);
  readonly relationsError = signal<string | null>(null);
  readonly relationsSuccess = signal<string | null>(null);
  readonly deletingRelationId = signal<string | null>(null);

  readonly relationRoleOptions = [
    { label: 'Diese Person ist das Kind', value: 'CHILD' as RelationRole },
    { label: 'Diese Person ist die Kontaktperson', value: 'GUARDIAN' as RelationRole }
  ];

  readonly relationTypeOptions: RelationTypeOption[] = [
    { label: 'Mutter', value: RelationType.Mother },
    { label: 'Vater', value: RelationType.Father },
    { label: 'Großmutter', value: RelationType.Grandmother },
    { label: 'Großvater', value: RelationType.Grandfather },
    { label: 'Stiefelternteil', value: RelationType.StepParent },
    { label: 'Sonstige', value: RelationType.Other }
  ];

  readonly otherPersonOptions = computed<PersonOption[]>(() =>
    this.allPersons()
      .filter(person => person.id !== this.personId)
      .map(person => ({ person, label: this.getPersonName(person) }))
      .sort((left, right) => left.label.localeCompare(right.label, 'de'))
  );

  readonly relationForm = this.formBuilder.group({
    role: this.formBuilder.nonNullable.control<RelationRole>('CHILD', Validators.required),
    otherPerson: this.formBuilder.control<PersonOption | null>(null, Validators.required),
    relationType: this.formBuilder.control<RelationTypeOption | null>(null, Validators.required)
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Keine Personen-ID in der Route gefunden.');
      return;
    }

    this.personId = id;
    this.loadPerson(id);
    this.loadRelations(id);
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
      notes: value.notes,
      phoneNumbers: value.phoneNumbers
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

  addRelation(): void {
    if (this.relationForm.invalid) {
      this.relationForm.markAllAsTouched();
      return;
    }

    const { role, otherPerson, relationType } = this.relationForm.getRawValue();

    if (!otherPerson?.person.id || !relationType?.value || !this.personId) {
      return;
    }

    const childPersonId = role === 'CHILD' ? this.personId : otherPerson.person.id;
    const guardianPersonId = role === 'CHILD' ? otherPerson.person.id : this.personId;

    this.relationsSaving.set(true);
    this.relationsError.set(null);
    this.relationsSuccess.set(null);

    this.personRelationsService
      .apiV1PersonRelationsPost({ childPersonId, guardianPersonId, relationType: relationType.value })
      .subscribe({
        next: () => {
          this.relationsSaving.set(false);
          this.relationsSuccess.set('Die Beziehung wurde angelegt.');
          this.relationForm.reset({ role: 'CHILD', otherPerson: null, relationType: null });
          this.loadRelations(this.personId);
        },
        error: error => {
          console.error('Person relation could not be created:', error);
          console.error('Backend error body:', error.error);
          this.relationsError.set('Die Beziehung konnte nicht angelegt werden.');
          this.relationsSaving.set(false);
        }
      });
  }

  deleteRelation(relation: PersonRelationDto): void {
    if (!relation.id) {
      return;
    }

    const confirmed = window.confirm('Diese Beziehung wirklich entfernen?');

    if (!confirmed) {
      return;
    }

    this.deletingRelationId.set(relation.id);
    this.relationsError.set(null);
    this.relationsSuccess.set(null);

    this.personRelationsService.apiV1PersonRelationsIdDelete(relation.id).subscribe({
      next: () => {
        this.deletingRelationId.set(null);
        this.loadRelations(this.personId);
      },
      error: error => {
        console.error('Person relation could not be deleted:', error);
        console.error('Backend error body:', error.error);
        this.relationsError.set('Die Beziehung konnte nicht entfernt werden.');
        this.deletingRelationId.set(null);
      }
    });
  }

  getPersonName(person?: PersonDto): string {
    if (!person) {
      return 'Unbekannte Person';
    }

    const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ');

    return fullName || person.nickname || 'Person ohne Namen';
  }

  getRelationTypeLabel(relationType?: RelationType): string {
    return this.relationTypeOptions.find(option => option.value === relationType)?.label ?? 'Unbekannt';
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

  private loadRelations(personId: string): void {
    this.relationsLoading.set(true);
    this.relationsError.set(null);

    this.personsService
      .apiV1PersonsGet()
      .pipe(
        switchMap(persons => {
          this.allPersons.set(persons);

          return forkJoin({
            guardianRelations: this.personRelationsService.apiV1PersonRelationsGet(personId, undefined),
            childRelations: this.personRelationsService.apiV1PersonRelationsGet(undefined, personId)
          });
        })
      )
      .subscribe({
        next: ({ guardianRelations, childRelations }) => {
          this.guardianRelations.set(guardianRelations);
          this.childRelations.set(childRelations);
          this.relationsLoading.set(false);
        },
        error: error => {
          console.error('Person relations could not be loaded:', error);
          console.error('Backend error body:', error.error);
          this.relationsError.set('Die Beziehungen konnten nicht geladen werden.');
          this.relationsLoading.set(false);
        }
      });
  }

  private toFormValue(person: PersonDto): PersonFormValue {
    return {
      firstName: person.firstName ?? '',
      lastName: person.lastName ?? '',
      birthDate: person.birthDate,
      nickname: person.nickname,
      notes: person.notes,
      phoneNumbers: (person.phoneNumbers ?? []).map(phoneNumber => ({
        type: phoneNumber.type!,
        number: phoneNumber.number ?? ''
      }))
    };
  }
}
