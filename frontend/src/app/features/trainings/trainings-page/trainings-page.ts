import { Component, effect, inject, signal } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';

import { TrainingsService } from '../../../api/api/trainings.service';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingStatus } from '../../../api/model/training-status';
import { CurrentContextService } from '../../../core/context/current-context.service';

@Component({
  selector: 'app-trainings-page',
  imports: [
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    RouterLink
  ],
  templateUrl: './trainings-page.html',
  styleUrl: './trainings-page.scss'
})
export class TrainingsPage {
  private readonly trainingsService = inject(TrainingsService);
  readonly context = inject(CurrentContextService);

  readonly trainings = signal<TrainingDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const teamId = this.context.selectedTeam()?.id;

      if (teamId) {
        this.loadTrainings(teamId);
      } else {
        this.trainings.set([]);
      }
    });
  }

  loadTrainings(teamId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.trainingsService
      .apiV1TrainingsGet(undefined, undefined, undefined, teamId)
      .subscribe({
        next: trainings => {
          this.trainings.set(
            [...trainings].sort((left, right) =>
              (right.trainingDate ?? '').localeCompare(left.trainingDate ?? '')
            )
          );
          this.loading.set(false);
        },
        error: error => {
          console.error('Trainings could not be loaded:', error);
          console.error('Backend error body:', error.error);

          this.error.set('Trainings konnten nicht geladen werden.');
          this.loading.set(false);
        }
      });
  }

  deleteTraining(training: TrainingDto): void {
    if (!training.id) {
      return;
    }

    const confirmed = window.confirm(
      `Training vom ${this.formatDate(training.trainingDate)} wirklich löschen?`
    );

    if (!confirmed) {
      return;
    }

    this.deletingId.set(training.id);
    this.error.set(null);

    this.trainingsService.apiV1TrainingsIdDelete(training.id).subscribe({
      next: () => {
        this.trainings.update(trainings => trainings.filter(item => item.id !== training.id));
        this.deletingId.set(null);
      },
      error: error => {
        console.error('Training could not be deleted:', error);
        console.error('Backend error body:', error.error);

        this.error.set('Das Training konnte nicht gelöscht werden.');
        this.deletingId.set(null);
      }
    });
  }

  getStatusLabel(status?: TrainingStatus): string {
    return status === TrainingStatus.Completed ? 'Stattgefunden' : 'Ausgefallen';
  }

  getStatusSeverity(status?: TrainingStatus): 'success' | 'danger' {
    return status === TrainingStatus.Completed ? 'success' : 'danger';
  }

  getTimeRange(training: TrainingDto): string {
    if (!training.startTime && !training.endTime) {
      return '-';
    }

    if (training.startTime && training.endTime) {
      return `${training.startTime} - ${training.endTime}`;
    }

    return training.startTime ?? training.endTime ?? '-';
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}.${month}.${year}`;
  }

  getWeekday(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('de-DE', { weekday: 'long' });
  }
}
