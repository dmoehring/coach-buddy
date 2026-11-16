import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { CurrentContextService } from '../../../core/context/current-context.service';
import { TrainingsService } from '../../../api/api/trainings.service';
import { CreateTrainingRequest } from '../../../api/model/create-training-request';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingStatus } from '../../../api/model/training-status';
import { TrainingType } from '../../../api/model/training-type';
import { UpdateTrainingRequest } from '../../../api/model/update-training-request';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { trainingLink } from '../../../shared/util/format';

@Component({
  selector: 'app-training-form-page',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PageHeader],
  templateUrl: './training-form-page.html',
  styleUrl: './training-form-page.scss'
})
export class TrainingFormPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly trainingsService = inject(TrainingsService);

  readonly context = inject(CurrentContextService);

  readonly TrainingType = TrainingType;
  readonly TrainingStatus = TrainingStatus;

  /** Set when the page is opened via `trainings/:id/edit`. */
  readonly trainingId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.trainingId !== null;

  readonly editedTraining = signal<TrainingDto | null>(null);
  readonly loadingTraining = signal(false);
  readonly saving = signal(false);
  readonly pageError = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<TrainingType>(this.initialType()),
    title: this.formBuilder.nonNullable.control(''),
    trainingDate: this.formBuilder.nonNullable.control(this.today(), Validators.required),
    startTime: this.formBuilder.nonNullable.control(''),
    endTime: this.formBuilder.nonNullable.control(''),
    location: this.formBuilder.nonNullable.control(''),
    status: this.formBuilder.nonNullable.control<TrainingStatus>(TrainingStatus.Completed),
    notes: this.formBuilder.nonNullable.control('')
  });

  readonly type = signal<TrainingType>(this.form.controls.type.value);
  readonly status = signal<TrainingStatus>(this.form.controls.status.value);

  readonly isGameDay = computed(() => this.type() === TrainingType.GameDay);

  readonly team = computed(() =>
    this.isEdit ? (this.editedTraining()?.team ?? null) : this.context.selectedTeam()
  );

  readonly heading = computed(() => {
    const noun = this.isGameDay() ? 'Spielfest' : 'Training';

    return this.isEdit ? `${noun} bearbeiten` : `${noun} erfassen`;
  });

  constructor() {
    if (this.trainingId) {
      this.loadTraining(this.trainingId);
    }
  }

  setType(type: TrainingType): void {
    this.form.controls.type.setValue(type);
    this.type.set(type);
  }

  setStatus(status: TrainingStatus): void {
    this.form.controls.status.setValue(status);
    this.status.set(status);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.trainingId) {
      this.updateTraining(this.trainingId);
    } else {
      this.createTraining();
    }
  }

  private loadTraining(trainingId: string): void {
    this.loadingTraining.set(true);
    this.pageError.set(null);

    this.trainingsService.apiV1TrainingsIdGet(trainingId).subscribe({
      next: training => {
        this.editedTraining.set(training);
        this.form.patchValue({
          type: training.type ?? TrainingType.Training,
          title: training.title ?? '',
          trainingDate: training.trainingDate?.slice(0, 10) ?? this.today(),
          startTime: this.toTimeInputValue(training.startTime),
          endTime: this.toTimeInputValue(training.endTime),
          location: training.location ?? '',
          notes: training.notes ?? '',
          status: training.status ?? TrainingStatus.Completed
        });
        this.type.set(this.form.controls.type.value);
        this.status.set(this.form.controls.status.value);
        this.loadingTraining.set(false);
      },
      error: error => {
        console.error('Training could not be loaded:', error);
        this.pageError.set('Der Eintrag konnte nicht geladen werden.');
        this.loadingTraining.set(false);
      }
    });
  }

  private updateTraining(trainingId: string): void {
    const value = this.form.getRawValue();

    const request: UpdateTrainingRequest = {
      type: value.type,
      title: value.title || undefined,
      trainingDate: value.trainingDate,
      startTime: value.startTime || undefined,
      endTime: value.endTime || undefined,
      location: value.location || undefined,
      status: value.status,
      notes: value.notes || undefined
    };

    this.saving.set(true);
    this.pageError.set(null);

    this.trainingsService.apiV1TrainingsIdPut(trainingId, request).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/trainings']);
      },
      error: error => this.failSave(error, 'Der Eintrag konnte nicht gespeichert werden.')
    });
  }

  private createTraining(): void {
    const teamId = this.context.selectedTeam()?.id;

    if (!teamId) {
      this.pageError.set('Bitte wähle zuerst oben eine Mannschaft aus.');
      return;
    }

    const value = this.form.getRawValue();

    const request: CreateTrainingRequest = {
      teamId,
      type: value.type,
      title: value.title || undefined,
      trainingDate: value.trainingDate,
      startTime: value.startTime || undefined,
      endTime: value.endTime || undefined,
      location: value.location || undefined,
      status: value.status,
      notes: value.notes || undefined
    };

    this.saving.set(true);
    this.pageError.set(null);

    this.trainingsService.apiV1TrainingsPost(request).subscribe({
      next: created => {
        this.saving.set(false);

        if (created.status === TrainingStatus.Completed && created.id) {
          this.router.navigate(trainingLink(created));
          return;
        }

        this.router.navigate(['/trainings']);
      },
      error: error => this.failSave(error, 'Der Eintrag konnte nicht angelegt werden.')
    });
  }

  private failSave(error: { error?: { message?: string } }, fallback: string): void {
    console.error('Training could not be saved:', error);
    this.pageError.set(error.error?.message ?? fallback);
    this.saving.set(false);
  }

  private initialType(): TrainingType {
    return this.route.snapshot.queryParamMap.get('type') === TrainingType.GameDay
      ? TrainingType.GameDay
      : TrainingType.Training;
  }

  private today(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
  }

  /** `<input type="time">` expects HH:mm, the backend returns HH:mm:ss. */
  private toTimeInputValue(value?: string): string {
    return value ? value.slice(0, 5) : '';
  }
}
