import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';

export interface PersonFormValue {
  firstName: string;
  lastName: string;
  birthDate?: string;
  nickname?: string;
  notes?: string;
}

@Component({
  selector: 'app-person-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DatePickerModule,
    InputTextModule
  ],
  templateUrl: './person-form.html',
  styleUrl: './person-form.scss'
})
export class PersonForm implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() initialValue: PersonFormValue | null = null;
  @Input() title = 'Personendaten';
  @Input() subtitle = 'Stammdaten der Person';
  @Input() submitLabel = 'Speichern';
  @Input() cancelLink = '/persons';
  @Input() saving = false;

  @Output() submitted = new EventEmitter<PersonFormValue>();

  readonly form = this.formBuilder.group({
    firstName: this.formBuilder.nonNullable.control('', Validators.required),
    lastName: this.formBuilder.nonNullable.control('', Validators.required),
    birthDate: this.formBuilder.control<Date | null>(null),
    nickname: this.formBuilder.nonNullable.control(''),
    notes: this.formBuilder.nonNullable.control('')
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.patchForm(this.initialValue);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.submitted.emit({
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      birthDate: formValue.birthDate ? this.formatDate(formValue.birthDate) : undefined,
      nickname: this.toOptionalString(formValue.nickname),
      notes: this.toOptionalString(formValue.notes)
    });
  }

  isInvalid(controlName: 'firstName' | 'lastName'): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  private patchForm(value: PersonFormValue | null): void {
    this.form.reset({
      firstName: value?.firstName ?? '',
      lastName: value?.lastName ?? '',
      birthDate: value?.birthDate ? this.parseDate(value.birthDate) : null,
      nickname: value?.nickname ?? '',
      notes: value?.notes ?? ''
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDate(value: string): Date | null {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private toOptionalString(value: string): string | undefined {
    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }
}
