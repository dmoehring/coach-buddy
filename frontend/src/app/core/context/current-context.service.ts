import { computed, Injectable, signal } from '@angular/core';

export interface SeasonOption {
  id: string;
  name: string;
}

export interface TeamOption {
  id: string;
  seasonId: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrentContextService {
  readonly seasons: SeasonOption[] = [
    {
      id: 'season-2025-2026',
      name: '2025/2026'
    },
    {
      id: 'season-2024-2025',
      name: '2024/2025'
    }
  ];

  readonly teams: TeamOption[] = [
    {
      id: 'team-minis',
      seasonId: 'season-2025-2026',
      name: 'Minis',
      description: 'Jahrgänge 2017–2019'
    },
    {
      id: 'team-f-jugend',
      seasonId: 'season-2025-2026',
      name: 'F-Jugend',
      description: 'Jahrgänge 2016–2017'
    },
    {
      id: 'team-minis-2024',
      seasonId: 'season-2024-2025',
      name: 'Minis',
      description: 'Jahrgänge 2016–2018'
    }
  ];

  readonly selectedSeason = signal<SeasonOption>(this.seasons[0]);
  readonly selectedTeam = signal<TeamOption>(this.teams[0]);

  readonly teamsForSelectedSeason = computed(() =>
    this.teams.filter(team => team.seasonId === this.selectedSeason().id)
  );

  selectSeason(season: SeasonOption): void {
    this.selectedSeason.set(season);

    const availableTeams = this.teams.filter(team => team.seasonId === season.id);
    const currentTeamStillAvailable = availableTeams.some(team => team.id === this.selectedTeam().id);

    if (!currentTeamStillAvailable && availableTeams.length > 0) {
      this.selectedTeam.set(availableTeams[0]);
    }
  }

  selectTeam(team: TeamOption): void {
    this.selectedTeam.set(team);
  }
}
