import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { CurrentContextService } from '../../context/current-context.service';
import { SessionService } from '../../auth/session.service';

const DARK_MODE_STORAGE_KEY = 'coach-buddy.dark-mode';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  imports: [
    NgTemplateOutlet,
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
  readonly context = inject(CurrentContextService);
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Start', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Trainings', icon: 'pi pi-calendar', route: '/trainings' },
    { label: 'Personen', icon: 'pi pi-users', route: '/persons' },
    { label: 'Teams', icon: 'pi pi-sitemap', route: '/teams' }
  ];

  readonly darkMode = signal(this.readStoredDarkMode());
  readonly sheetOpen = signal(false);

  constructor() {
    document.body.classList.toggle('app-dark', this.darkMode());

    // The context sheet covers the page, so close it whenever the user navigates.
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.sheetOpen.set(false));
  }

  logout(): void {
    this.session.clearSession();
    this.router.navigate(['/login']);
  }

  toggleDarkMode(): void {
    this.darkMode.update(value => !value);
    document.body.classList.toggle('app-dark', this.darkMode());

    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(this.darkMode()));
    } catch {
      // Storage can be unavailable (private mode); the preference then just isn't remembered.
    }
  }

  toggleSheet(): void {
    this.sheetOpen.update(value => !value);
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
  }

  private readStoredDarkMode(): boolean {
    try {
      return localStorage.getItem(DARK_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
