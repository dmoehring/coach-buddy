import { Component, Input } from '@angular/core';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { Birthday } from '../../birthdays';

@Component({
  selector: 'app-birthdays-card',
  imports: [
    CardModule,
    TagModule
  ],
  templateUrl: './birthdays-card.html',
  styleUrl: './birthdays-card.scss'
})
export class BirthdaysCard {
  @Input({ required: true })
  birthdays!: Birthday[];

  @Input()
  teamName: string | null = null;

  @Input()
  windowDays = 7;

  formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  }

  getRelativeLabel(birthday: Birthday): string {
    const days = birthday.daysFromToday;

    if (days === 0) {
      return 'Heute';
    }

    if (days === 1) {
      return 'Morgen';
    }

    if (days === -1) {
      return 'Gestern';
    }

    return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`;
  }
}
