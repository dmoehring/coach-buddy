import { Injectable, computed, signal } from '@angular/core';

interface StoredSession {
  token: string;
  expiresAt: string;
  username: string;
  displayName: string;
}

const STORAGE_KEY = 'coach-buddy.session';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly session = signal<StoredSession | null>(this.readFromStorage());

  readonly isAuthenticated = computed(() => {
    const session = this.session();
    return session !== null && new Date(session.expiresAt).getTime() > Date.now();
  });

  readonly displayName = computed(() => this.session()?.displayName ?? null);

  get token(): string | null {
    return this.isAuthenticated() ? this.session()?.token ?? null : null;
  }

  startSession(session: StoredSession): void {
    this.session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clearSession(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private readFromStorage(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }
}
