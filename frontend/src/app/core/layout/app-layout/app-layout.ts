import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { CurrentContextService } from '../../context/current-context.service';
import { SessionService } from '../../auth/session.service';

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
  readonly context = inject(CurrentContextService);
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly darkMode = signal(false);
  readonly mobileMenuOpen = signal(false);

  logout(): void {
    this.session.clearSession();
    this.router.navigate(['/login']);
  }

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
