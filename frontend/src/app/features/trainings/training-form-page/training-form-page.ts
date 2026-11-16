import { Component, effect, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { CurrentContextService } from '../../../core/context/current-context.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { CreateTrainingRequest } from '../../../api/model/create-training-request';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingStatus } from '../../../api/model/training-status';
import { UpdateTrainingRequest } from '../../../api/model/update-training-request';
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
  private readonly route = inject(ActivatedRoute);
  private readonly trainingsService = inject(TrainingsService);

  readonly context = inject(CurrentContextService);

  /** Set when the page is opened via `trainings/:id/edit`. */
  readonly trainingId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.trainingId !== null;

  readonly editedTraining = signal<TrainingDto | null>(null);
  readonly loadingTraining = signal(false);
  readonly saving = signal(false);
  readonly pageError = signal<string | null>(null);

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
    if (this.trainingId) {
      // Season and team are fixed for an existing training, so they neither
      // have to be validated nor kept in sync with the global context.
      this.form.controls.season.clearValidators();
      this.form.controls.team.clearValidators();
      this.form.controls.season.updateValueAndValidity();
      this.form.controls.team.updateValueAndValidity();

      this.loadTraining(this.trainingId);
      return;
    }

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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.trainingId) {
      this.updateTraining(this.trainingId);
      return;
    }

    this.createTraining();
  }

  private loadTraining(trainingId: string): void {
    this.loadingTraining.set(true);
    this.pageError.set(null);

    this.trainingsService.apiV1TrainingsIdGet(trainingId).subscribe({
      next: training => {
        this.editedTraining.set(training);
        this.form.patchValue({
          trainingDate: training.trainingDate
            ? this.parseDate(training.trainingDate)
            : new Date(),
          startTime: this.toTimeInputValue(training.startTime),
          endTime: this.toTimeInputValue(training.endTime),
          location: training.location ?? '',
          notes: training.notes ?? '',
          status:
            this.trainingStatuses.find(option => option.value === training.status) ??
            this.trainingStatuses[0]
        });
        this.loadingTraining.set(false);
      },
      error: error => {
        console.error('Training could not be loaded:', error);
        console.error('Backend error body:', error.error);

        this.pageError.set('Das Training konnte nicht geladen werden.');
        this.loadingTraining.set(false);
      }
    });
  }

  private updateTraining(trainingId: string): void {
    const formValue = this.form.getRawValue();

    const request: UpdateTrainingRequest = {
      trainingDate: this.formatDate(formValue.trainingDate),
      startTime: formValue.startTime || undefined,
      endTime: formValue.endTime || undefined,
      location: formValue.location || undefined,
      status: formValue.status.value,
      notes: formValue.notes || undefined
    };

    this.saving.set(true);
    this.pageError.set(null);

    this.trainingsService.apiV1TrainingsIdPut(trainingId, request).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/trainings']);
      },
      error: error => {
        console.error('Training could not be updated:', error);
        console.error('Backend error body:', error.error);

        this.pageError.set(
          error.error?.message ?? 'Das Training konnte nicht gespeichert werden.'
        );
        this.saving.set(false);
      }
    });
  }

  private createTraining(): void {
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

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  /** `<input type="time">` expects HH:mm, the backend returns HH:mm:ss. */
  private toTimeInputValue(value?: string): string {
    return value ? value.slice(0, 5) : '';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
