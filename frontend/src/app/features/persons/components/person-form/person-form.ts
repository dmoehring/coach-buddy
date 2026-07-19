import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { PhoneType } from '../../../../api/model/phone-type';

export interface PersonPhoneNumberFormValue {
  type: PhoneType;
  number: string;
}

export interface PersonFormValue {
  firstName: string;
  lastName: string;
  birthDate?: string;
  nickname?: string;
  notes?: string;
  phoneNumbers: PersonPhoneNumberFormValue[];
}

interface PhoneTypeOption {
  label: string;
  value: PhoneType;
}

@Component({
  selector: 'app-person-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DatePickerModule,
    InputTextModule,
    SelectModule
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

  readonly phoneTypeOptions: PhoneTypeOption[] = [
    { label: 'Mobil', value: PhoneType.Mobile },
    { label: 'Privat', value: PhoneType.Home },
    { label: 'Geschäftlich', value: PhoneType.Work },
    { label: 'Notfall', value: PhoneType.Emergency }
  ];

  readonly form = this.formBuilder.group({
    firstName: this.formBuilder.nonNullable.control('', Validators.required),
    lastName: this.formBuilder.nonNullable.control('', Validators.required),
    birthDate: this.formBuilder.control<Date | null>(null),
    nickname: this.formBuilder.nonNullable.control(''),
    notes: this.formBuilder.nonNullable.control(''),
    phoneNumbers: this.formBuilder.array<FormGroup>([])
  });

  get phoneNumbers(): FormArray {
    return this.form.controls.phoneNumbers;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.patchForm(this.initialValue);
    }
  }

  addPhoneNumber(): void {
    this.phoneNumbers.push(this.createPhoneNumberGroup());
  }

  removePhoneNumber(index: number): void {
    this.phoneNumbers.removeAt(index);
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
      notes: this.toOptionalString(formValue.notes),
      phoneNumbers: (formValue.phoneNumbers as PersonPhoneNumberFormValue[]).map(phoneNumber => ({
        type: phoneNumber.type,
        number: phoneNumber.number.trim()
      }))
    });
  }

  isInvalid(controlName: 'firstName' | 'lastName'): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  isPhoneNumberInvalid(index: number): boolean {
    const control = this.phoneNumbers.at(index).get('number');

    return Boolean(control?.invalid && (control.dirty || control.touched));
  }

  private createPhoneNumberGroup(value?: PersonPhoneNumberFormValue): FormGroup {
    return this.formBuilder.group({
      type: this.formBuilder.nonNullable.control(value?.type ?? PhoneType.Mobile, Validators.required),
      number: this.formBuilder.nonNullable.control(value?.number ?? '', Validators.required)
    });
  }

  private patchForm(value: PersonFormValue | null): void {
    this.form.reset({
      firstName: value?.firstName ?? '',
      lastName: value?.lastName ?? '',
      birthDate: value?.birthDate ? this.parseDate(value.birthDate) : null,
      nickname: value?.nickname ?? '',
      notes: value?.notes ?? ''
    });

    this.phoneNumbers.clear();
    (value?.phoneNumbers ?? []).forEach(phoneNumber => {
      this.phoneNumbers.push(this.createPhoneNumberGroup(phoneNumber));
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
