import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideApi } from './api/provide-api';
import { authInterceptor } from './core/auth/auth.interceptor';
import { environment } from '../environments/environment';
import { CoachBuddyPreset } from './core/theme/coach-buddy-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideApi(environment.apiBaseUrl),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: CoachBuddyPreset,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    })
  ]
};
