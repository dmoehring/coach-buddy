import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CurrentContextService } from './current-context.service';
import { SeasonDto } from '../../api/model/season-dto';
import { TeamDto } from '../../api/model/team-dto';

const STORAGE_KEY = 'coach-buddy.context';

const openSeason: SeasonDto = { id: 'season-open', name: '2026 / 2027', startDate: '2026-04-20' };
const closedSeason: SeasonDto = {
  id: 'season-closed',
  name: '2025 / 2026',
  startDate: '2025-09-01',
  endDate: '2026-04-19'
};

const teamA: TeamDto = { id: 'team-a', seasonId: 'season-open', name: 'Minis' };
const teamB: TeamDto = { id: 'team-b', seasonId: 'season-open', name: '2. Herren' };

describe('CurrentContextService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(STORAGE_KEY);
  });

  function flushSeasons(seasons: SeasonDto[]): void {
    httpMock.expectOne(req => req.url.endsWith('/api/v1/seasons')).flush(seasons);
  }

  function flushTeams(seasonId: string, teams: TeamDto[]): void {
    httpMock
      .expectOne(req => req.url.endsWith('/api/v1/teams') && req.params.get('seasonId') === seasonId)
      .flush(teams);
  }

  it('defaults to the open season and its first team when nothing is persisted', () => {
    const service = TestBed.inject(CurrentContextService);

    flushSeasons([closedSeason, openSeason]);
    flushTeams('season-open', [teamA, teamB]);

    expect(service.selectedSeason()?.id).toBe('season-open');
    expect(service.selectedTeam()?.id).toBe('team-a');
  });

  it('persists the selected season and team to localStorage', () => {
    const service = TestBed.inject(CurrentContextService);

    flushSeasons([closedSeason, openSeason]);
    flushTeams('season-open', [teamA, teamB]);

    service.selectTeam(teamB);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toEqual({ seasonId: 'season-open', teamId: 'team-b' });
  });

  it('restores a previously persisted season and team instead of defaulting', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seasonId: 'season-closed', teamId: 'team-b' }));

    const service = TestBed.inject(CurrentContextService);

    flushSeasons([closedSeason, openSeason]);
    flushTeams('season-closed', [teamB]);

    expect(service.selectedSeason()?.id).toBe('season-closed');
    expect(service.selectedTeam()?.id).toBe('team-b');
  });

  it('falls back to the first team when the persisted team is not part of the season', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seasonId: 'season-open', teamId: 'unknown-team' }));

    const service = TestBed.inject(CurrentContextService);

    flushSeasons([closedSeason, openSeason]);
    flushTeams('season-open', [teamA, teamB]);

    expect(service.selectedTeam()?.id).toBe('team-a');
  });
});
