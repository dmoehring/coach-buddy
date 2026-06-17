import { Component, effect, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { CurrentContextService } from '../../../core/context/current-context.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { CreateTrainingRequest } from '../../../api/model/create-training-request';
import { TrainingStatus } from '../../../api/model/training-status';
import { SeasonDto } from '../../../api/model/season-dto';
import { TeamDto } from '../../../api/model/team-dto';

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
  private readonly trainingsService = inject(TrainingsService);

  readonly context = inject(CurrentContextService);

  readonly trainingStatuses: TrainingStatusOption[] = [
    {
      value: TrainingStatus.Completed,
      label: 'Stattgefunden'
    },
    {
      value: TrainingStatus.Cancelled,
      label: 'Ausgefallen'
    }
  ];

  readonly form = this.formBuilder.group({
    season: this.formBuilder.control<SeasonDto | null>(
      null,
      Validators.required
    ),
    team: this.formBuilder.control<TeamDto | null>(
      null,
      Validators.required
    ),
    trainingDate: this.formBuilder.nonNullable.control(
      new Date(),
      Validators.required
    ),
    startTime: this.formBuilder.nonNullable.control(''),
    endTime: this.formBuilder.nonNullable.control(''),
    location: this.formBuilder.nonNullable.control(''),
    status: this.formBuilder.nonNullable.control(
      this.trainingStatuses[0],
      Validators.required
    ),
    notes: this.formBuilder.nonNullable.control('')
  });

  constructor() {
    this.form.controls.season.valueChanges.subscribe(season => {
      this.context.selectSeason(season);
    });

    this.form.controls.team.valueChanges.subscribe(team => {
      this.context.selectTeam(team);
    });

    effect(() => {
      const selectedSeason = this.context.selectedSeason();
      const selectedTeam = this.context.selectedTeam();

      const formSeason = this.form.controls.season.value;
      const formTeam = this.form.controls.team.value;

      if (formSeason?.id !== selectedSeason?.id) {
        this.form.controls.season.setValue(selectedSeason, {
          emitEvent: false
        });
      }

      if (formTeam?.id !== selectedTeam?.id) {
        this.form.controls.team.setValue(selectedTeam, {
          emitEvent: false
        });
      }
    });
  }

  createTraining(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const teamId = formValue.team?.id;

    if (!teamId) {
      this.form.controls.team.setErrors({ required: true });
      this.form.controls.team.markAsTouched();
      return;
    }

    const request: CreateTrainingRequest = {
      teamId,
      trainingDate: this.formatDate(formValue.trainingDate),
      startTime: formValue.startTime || undefined,
      endTime: formValue.endTime || undefined,
      location: formValue.location || undefined,
      status: formValue.status.value,
      notes: formValue.notes || undefined
    };

    this.trainingsService.apiV1TrainingsPost(request).subscribe({
      next: createdTraining => {
        if (
          createdTraining.status === TrainingStatus.Completed &&
          createdTraining.id
        ) {
          this.router.navigate([
            '/trainings',
            createdTraining.id,
            'attendance'
          ]);
          return;
        }

        this.router.navigate(['/trainings']);
      },
      error: error => {
        console.error('Training could not be created:', error);
        console.error('Backend error body:', error.error);
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
