import { Component, computed, inject, signal } from '@angular/core';
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

import { SeasonsService } from '../../../api/api/seasons.service';
import { CreateSeasonRequest } from '../../../api/model/create-season-request';
import { CurrentContextService } from '../../../core/context/current-context.service';

@Component({
  selector: 'app-season-create-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DatePickerModule,
    InputTextModule
  ],
  templateUrl: './season-create-page.html',
  styleUrl: './season-create-page.scss'
})
export class SeasonCreatePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly seasonsService = inject(SeasonsService);
  private readonly router = inject(Router);

  readonly context = inject(CurrentContextService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly openSeason = computed(() =>
    this.context.seasons().find(season => !season.endDate) ?? null
  );

  readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(100)
    ]),
    startDate: this.formBuilder.control<Date | null>(new Date(), Validators.required)
  });

  createSeason(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (!formValue.startDate) {
      return;
    }

    const request: CreateSeasonRequest = {
      name: formValue.name.trim(),
      startDate: this.formatDate(formValue.startDate)
    };

    this.saving.set(true);
    this.error.set(null);

    this.seasonsService.apiV1SeasonsPost(request).subscribe({
      next: createdSeason => {
        this.saving.set(false);
        this.context.reloadContext(createdSeason.id);
        this.router.navigate(['/teams']);
      },
      error: error => {
        console.error('Season could not be created:', error);
        console.error('Backend error body:', error.error);

        this.error.set(
          error.error?.message ?? 'Die Saison konnte nicht angelegt werden.'
        );
        this.saving.set(false);
      }
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(value?: string): string {
    if (!value) {
      return '';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    return year && month && day ? `${day}.${month}.${year}` : value;
  }
}
