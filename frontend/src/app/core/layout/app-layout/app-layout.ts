import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

interface SeasonOption {
  id: string;
  name: string;
}

interface TeamOption {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-layout',
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    SelectModule
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss'
})
export class AppLayout {
  readonly darkMode = signal(false);
  readonly mobileMenuOpen = signal(false);

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
      name: 'Minis',
      description: 'Jahrgänge 2017–2019'
    },
    {
      id: 'team-f-jugend',
      name: 'F-Jugend',
      description: 'Jahrgänge 2016–2017'
    }
  ];

  selectedSeason = this.seasons[0];
  selectedTeam = this.teams[0];

  toggleDarkMode(): void {
    this.darkMode.update(value => !value);
    document.body.classList.toggle('app-dark', this.darkMode());
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
