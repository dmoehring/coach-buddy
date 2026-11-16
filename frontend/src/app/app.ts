import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    // Apply the saved theme before any page renders so the login page doesn't flash light.
    try {
      document.body.classList.toggle('app-dark', localStorage.getItem('coach-buddy.dark-mode') === 'true');
    } catch {
      // Storage can be unavailable; fall back to the light theme.
    }
  }
}
