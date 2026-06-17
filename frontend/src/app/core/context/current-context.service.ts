import { computed, inject, Injectable, signal } from '@angular/core';

import { SeasonsService } from '../../api/api/seasons.service';
import { TeamsService } from '../../api/api/teams.service';
import { SeasonDto } from '../../api/model/season-dto';
import { TeamDto } from '../../api/model/team-dto';

@Injectable({
  providedIn: 'root'
})
export class CurrentContextService {
  private readonly seasonsService = inject(SeasonsService);
  private readonly teamsService = inject(TeamsService);

  readonly seasons = signal<SeasonDto[]>([]);
  readonly teams = signal<TeamDto[]>([]);

  readonly selectedSeason = signal<SeasonDto | null>(null);
  readonly selectedTeam = signal<TeamDto | null>(null);

  readonly loadingSeasons = signal(false);
  readonly loadingTeams = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Die Teams werden bereits nach Saison vom Backend geladen.
   * Der Name bleibt bestehen, damit die bisherigen Templates
   * zunächst weiterverwendet werden können.
   */
  readonly teamsForSelectedSeason = computed(() => this.teams());

  constructor() {
    this.loadSeasons();
  }

  loadSeasons(): void {
    this.loadingSeasons.set(true);
    this.error.set(null);

    this.seasonsService.apiV1SeasonsGet().subscribe({
      next: seasons => {
        this.seasons.set(seasons);
        this.loadingSeasons.set(false);

        if (seasons.length === 0) {
          this.selectedSeason.set(null);
          this.selectedTeam.set(null);
          this.teams.set([]);
          return;
        }

        const currentSeasonId = this.selectedSeason()?.id;

        const selectedSeason =
          seasons.find(season => season.id === currentSeasonId)
          ?? seasons.find(season => !season.endDate)
          ?? seasons[0];

        this.selectSeason(selectedSeason);
      },
      error: error => {
        console.error('Seasons could not be loaded:', error);
        console.error('Backend error body:', error.error);

        this.error.set('Saisons konnten nicht geladen werden.');
        this.loadingSeasons.set(false);
      }
    });
  }

  selectSeason(season: SeasonDto | null): void {
    this.selectedSeason.set(season);

    this.selectedTeam.set(null);
    this.teams.set([]);

    if (!season?.id) {
      return;
    }

    this.loadTeams(season.id);
  }

  loadTeams(seasonId: string): void {
    this.loadingTeams.set(true);
    this.error.set(null);

    this.teamsService.apiV1TeamsGet(seasonId).subscribe({
      next: teams => {
        this.teams.set(teams);
        this.loadingTeams.set(false);

        if (teams.length === 0) {
          this.selectedTeam.set(null);
          return;
        }

        const currentTeamId = this.selectedTeam()?.id;

        const selectedTeam =
          teams.find(team => team.id === currentTeamId)
          ?? teams[0];

        this.selectedTeam.set(selectedTeam);
      },
      error: error => {
        console.error('Teams could not be loaded:', error);
        console.error('Backend error body:', error.error);

        this.error.set('Mannschaften konnten nicht geladen werden.');
        this.loadingTeams.set(false);
      }
    });
  }

  selectTeam(team: TeamDto | null): void {
    this.selectedTeam.set(team);
  }

  reloadContext(): void {
    this.loadSeasons();
  }
}
