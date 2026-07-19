import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../../api/api/auth.service';
import { SessionService } from '../../../core/auth/session.service';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    username: this.formBuilder.nonNullable.control('', Validators.required),
    password: this.formBuilder.nonNullable.control('', Validators.required)
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();

    this.loading.set(true);
    this.error.set(null);

    this.authService.apiV1AuthLoginPost({ username, password }).subscribe({
      next: response => {
        if (!response.token || !response.expiresAt || !response.username || !response.displayName) {
          this.loading.set(false);
          this.error.set('Die Anmeldung ist fehlgeschlagen.');
          return;
        }

        this.session.startSession({
          token: response.token,
          expiresAt: response.expiresAt,
          username: response.username,
          displayName: response.displayName
        });

        this.loading.set(false);

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Benutzername oder Passwort ist falsch.');
      }
    });
  }
}
