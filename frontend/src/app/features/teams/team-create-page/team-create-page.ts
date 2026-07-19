import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { TeamsService } from '../../../api/api/teams.service';
import { CreateTeamRequest } from '../../../api/model/create-team-request';
import { CurrentContextService } from '../../../core/context/current-context.service';

@Component({
  selector: 'app-team-create-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule
  ],
  templateUrl: './team-create-page.html',
  styleUrl: './team-create-page.scss'
})
export class TeamCreatePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly teamsService = inject(TeamsService);
  private readonly router = inject(Router);

  readonly context = inject(CurrentContextService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],
    description: ['', Validators.maxLength(500)]
  });

  createTeam(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedSeason = this.context.selectedSeason();
    const seasonId = selectedSeason?.id;

    if (!seasonId) {
      this.error.set(
        'Es ist keine gültige Saison ausgewählt.'
      );
      return;
    }

    const formValue = this.form.getRawValue();

    const request: CreateTeamRequest = {
      seasonId,
      name: formValue.name.trim(),
      description:
        formValue.description.trim() || undefined
    };

    this.saving.set(true);
    this.error.set(null);

    this.teamsService.apiV1TeamsPost(request).subscribe({
      next: createdTeam => {
        this.saving.set(false);

        if (!createdTeam.id) {
          this.error.set(
            'Das Team wurde angelegt, aber das Backend hat keine Team-ID zurückgegeben.'
          );
          return;
        }

        this.context.selectTeam(createdTeam);
        this.context.loadTeams(seasonId);

        this.router.navigate(
          [
            '/teams',
            createdTeam.id,
            'members'
          ],
          {
            queryParams: {
              created: 'true'
            }
          }
        );
      },
      error: error => {
        console.error(
          'Team could not be created:',
          error
        );
        console.error(
          'Backend error body:',
          error.error
        );

        this.error.set(
          'Das Team konnte nicht angelegt werden.'
        );
        this.saving.set(false);
      }
    });
  }
}


