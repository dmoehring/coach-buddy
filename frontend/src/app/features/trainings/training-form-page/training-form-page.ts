import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { CurrentContextService } from '../../../core/context/current-context.service';

type TrainingStatus = 'COMPLETED' | 'CANCELLED';

interface TrainingStatusOption {
  value: TrainingStatus;
  label: string;
}

@Component({
  selector: 'app-training-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DatePickerModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './training-form-page.html',
  styleUrl: './training-form-page.scss'
})
export class TrainingFormPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly context = inject(CurrentContextService);

  readonly trainingStatuses: TrainingStatusOption[] = [
    {
      value: 'COMPLETED',
      label: 'Stattgefunden'
    },
    {
      value: 'CANCELLED',
      label: 'Ausgefallen'
    }
  ];

  readonly form = this.formBuilder.nonNullable.group({
    season: [this.context.selectedSeason(), Validators.required],
    team: [this.context.selectedTeam(), Validators.required],
    trainingDate: [new Date(), Validators.required],
    startTime: [''],
    endTime: [''],
    location: [''],
    status: [this.trainingStatuses[0], Validators.required],
    notes: ['']
  });

  constructor() {
    this.form.controls.season.valueChanges.subscribe(season => {
      this.context.selectSeason(season);
      this.form.controls.team.setValue(this.context.selectedTeam(), { emitEvent: false });
    });

    this.form.controls.team.valueChanges.subscribe(team => {
      this.context.selectTeam(team);
    });

    effect(() => {
      const selectedSeason = this.context.selectedSeason();
      const selectedTeam = this.context.selectedTeam();

      if (this.form.controls.season.value.id !== selectedSeason.id) {
        this.form.controls.season.setValue(selectedSeason, { emitEvent: false });
      }

      if (this.form.controls.team.value.id !== selectedTeam.id) {
        this.form.controls.team.setValue(selectedTeam, { emitEvent: false });
      }
    });
  }

  createTraining(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const createdTraining = {
      id: 'mock-training-id',
      seasonId: formValue.season.id,
      teamId: formValue.team.id,
      trainingDate: formValue.trainingDate,
      startTime: formValue.startTime || null,
      endTime: formValue.endTime || null,
      location: formValue.location || null,
      status: formValue.status.value,
      notes: formValue.notes || null
    };

    console.log('Training created:', createdTraining);

    if (createdTraining.status === 'COMPLETED') {
      this.router.navigate(['/trainings', createdTraining.id, 'attendance']);
      return;
    }

    this.router.navigate(['/trainings']);
  }
}
