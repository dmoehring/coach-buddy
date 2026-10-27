import { Component, computed, inject, input, model } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { PersonDto } from '../../../../api/model/person-dto';
import {
  RELATION_ROLE_OPTIONS,
  RELATION_TYPE_OPTIONS,
  RelationRole,
  RelationTypeOption
} from '../../relation-options';

export interface PersonOption {
  label: string;
  person: PersonDto;
}

export interface RelationDraft {
  role: RelationRole;
  otherPerson: PersonDto;
  relationType: RelationTypeOption;
}

@Component({
  selector: 'app-person-relations-draft',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule
  ],
  templateUrl: './person-relations-draft.html',
  styleUrl: './person-relations-draft.scss'
})
export class PersonRelationsDraft {
  private readonly formBuilder = inject(FormBuilder);

  readonly persons = input<PersonDto[]>([]);
  readonly drafts = model<RelationDraft[]>([]);

  readonly roleOptions = RELATION_ROLE_OPTIONS;
  readonly relationTypeOptions = RELATION_TYPE_OPTIONS;

  readonly personOptions = computed<PersonOption[]>(() => {
    const used = new Set(this.drafts().map(draft => draft.otherPerson.id));

    return this.persons()
      .filter(person => !used.has(person.id))
      .map(person => ({ person, label: this.getPersonName(person) }))
      .sort((left, right) => left.label.localeCompare(right.label, 'de'));
  });

  readonly form = this.formBuilder.group({
    role: this.formBuilder.nonNullable.control<RelationRole>('CHILD', Validators.required),
    otherPerson: this.formBuilder.control<PersonOption | null>(null, Validators.required),
    relationType: this.formBuilder.control<RelationTypeOption | null>(null, Validators.required)
  });

  add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { role, otherPerson, relationType } = this.form.getRawValue();

    if (!otherPerson || !relationType) {
      return;
    }

    this.drafts.update(drafts => [...drafts, { role, otherPerson: otherPerson.person, relationType }]);
    this.form.reset({ role, otherPerson: null, relationType: null });
  }

  remove(index: number): void {
    this.drafts.update(drafts => drafts.filter((_, current) => current !== index));
  }

  getPersonName(person: PersonDto): string {
    const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ');

    return fullName || person.nickname || 'Person ohne Namen';
  }

  getRoleDescription(draft: RelationDraft): string {
    return `${draft.role === 'CHILD' ? 'Kontaktperson' : 'Kind'} · ${draft.relationType.label}`;
  }
}
