import { computed, inject, Injectable, signal } from '@angular/core';

import { SeasonsService } from '../../api/api/seasons.service';
import { TeamsService } from '../../api/api/teams.service';
import { SeasonDto } from '../../api/model/season-dto';
import { TeamDto } from '../../api/model/team-dto';

interface StoredContext {
  seasonId: string | null;
  teamId: string | null;
}

const STORAGE_KEY = 'coach-buddy.context';

@Injectable({
  providedIn: 'root'
})
export class CurrentContextService {
  private readonly seasonsService = inject(SeasonsService);
  private readonly teamsService = inject(TeamsService);

  private readonly persistedSeasonId: string | null;
  private readonly persistedTeamId: string | null;

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
    const stored = this.readStoredContext();
    this.persistedSeasonId = stored.seasonId;
    this.persistedTeamId = stored.teamId;

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
          this.teams.set([]);
          this.selectTeam(null);
          return;
        }

        const currentSeasonId = this.selectedSeason()?.id ?? this.persistedSeasonId;

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
    this.teams.set([]);
    this.selectTeam(null);

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
          this.selectTeam(null);
          return;
        }

        const currentTeamId = this.selectedTeam()?.id ?? this.persistedTeamId;

        const selectedTeam =
          teams.find(team => team.id === currentTeamId)
          ?? teams[0];

        this.selectTeam(selectedTeam);
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
    this.persistContext();
  }

  reloadContext(): void {
    this.loadSeasons();
  }

  private persistContext(): void {
    const context: StoredContext = {
      seasonId: this.selectedSeason()?.id ?? null,
      teamId: this.selectedTeam()?.id ?? null
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  }

  private readStoredContext(): StoredContext {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { seasonId: null, teamId: null };
    }

    try {
      return JSON.parse(raw) as StoredContext;
    } catch {
      return { seasonId: null, teamId: null };
    }
  }
}
