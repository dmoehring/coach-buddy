import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { TrainingsService } from '../../../api/api/trainings.service';
import { TrainingDto } from '../../../api/model/training-dto';
import { TrainingStatus } from '../../../api/model/training-status';
import { TrainingType } from '../../../api/model/training-type';
import { CurrentContextService } from '../../../core/context/current-context.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CsvExportService } from '../../../shared/util/export.service';
import {
  formatDate,
  isGameDay,
  timeRange,
  trainingLink,
  trainingTitle,
  weekday
} from '../../../shared/util/format';

type TypeFilter = 'ALL' | TrainingType;

interface MonthGroup {
  key: string;
  label: string;
  trainings: TrainingDto[];
}

@Component({
  selector: 'app-trainings-page',
  imports: [ButtonModule, RouterLink, PageHeader],
  templateUrl: './trainings-page.html',
  styleUrl: './trainings-page.scss'
})
export class TrainingsPage {
  private readonly trainingsService = inject(TrainingsService);
  readonly context = inject(CurrentContextService);
  readonly csv = inject(CsvExportService);

  readonly TrainingType = TrainingType;

  readonly trainings = signal<TrainingDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly filter = signal<TypeFilter>('ALL');

  readonly filtered = computed(() => {
    const filter = this.filter();

    return filter === 'ALL'
      ? this.trainings()
      : this.trainings().filter(training => training.type === filter);
  });

  readonly groups = computed<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();

    for (const training of this.filtered()) {
      const key = (training.trainingDate ?? '').slice(0, 7);
      const group = groups.get(key) ?? { key, label: this.monthLabel(key), trainings: [] };

      group.trainings.push(training);
      groups.set(key, group);
    }

    return [...groups.values()];
  });

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
      `${this.title(training)} vom ${formatDate(training.trainingDate)} wirklich löschen? `
      + 'Die erfasste Anwesenheit geht dabei verloren.'
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
        this.error.set('Der Eintrag konnte nicht gelöscht werden.');
        this.deletingId.set(null);
      }
    });
  }

  exportAttendance(): void {
    const teamId = this.context.selectedTeam()?.id;

    if (teamId) {
      this.csv.teamAttendance(teamId);
    }
  }

  title(training: TrainingDto): string {
    return trainingTitle(training);
  }

  link(training: TrainingDto): string[] {
    return trainingLink(training);
  }

  isGameDay(training: TrainingDto): boolean {
    return isGameDay(training);
  }

  isCancelled(training: TrainingDto): boolean {
    return training.status === TrainingStatus.Cancelled;
  }

  day(training: TrainingDto): string {
    return (training.trainingDate ?? '').slice(8, 10);
  }

  weekdayShort(training: TrainingDto): string {
    return weekday(training.trainingDate).slice(0, 2);
  }

  meta(training: TrainingDto): string {
    return [timeRange(training.startTime, training.endTime), training.location]
      .filter(Boolean)
      .join(' · ');
  }

  private monthLabel(key: string): string {
    const [year, month] = key.split('-').map(Number);

    if (!year || !month) {
      return 'Ohne Datum';
    }

    return new Date(year, month - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }
}
