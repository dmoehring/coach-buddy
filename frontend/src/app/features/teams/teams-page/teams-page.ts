import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { TeamDto } from '../../../api/model/team-dto';
import { CurrentContextService } from '../../../core/context/current-context.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-teams-page',
  imports: [
    RouterLink,
    ButtonModule,
    PageHeader
  ],
  templateUrl: './teams-page.html',
  styleUrl: './teams-page.scss'
})
export class TeamsPage {
  readonly context = inject(CurrentContextService);

  selectTeam(team: TeamDto): void {
    this.context.selectTeam(team);
  }

  isSelected(team: TeamDto): boolean {
    const selectedTeamId = this.context.selectedTeam()?.id;

    return Boolean(
      team.id &&
      selectedTeamId &&
      team.id === selectedTeamId
    );
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'offen';
    }

    const normalizedValue = value.slice(0, 10);
    const [year, month, day] = normalizedValue.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day}.${month}.${year}`;
  }
}
