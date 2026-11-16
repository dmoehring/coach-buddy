import { PersonDto } from '../../api/model/person-dto';
import { TeamMemberRole } from '../../api/model/team-member-role';
import { TrainingDto } from '../../api/model/training-dto';
import { TrainingType } from '../../api/model/training-type';

export const ROLE_LABELS: Record<TeamMemberRole, string> = {
  [TeamMemberRole.Player]: 'Spieler',
  [TeamMemberRole.Coach]: 'Trainer',
  [TeamMemberRole.AssistantCoach]: 'Co-Trainer'
};

export function formatDate(value?: string | null): string {
  if (!value) {
    return '–';
  }

  const [year, month, day] = value.slice(0, 10).split('-');

  return year && month && day ? `${day}.${month}.${year}` : value;
}

/** "Di., 10.03." – short form for lists. */
export function formatShortDate(value?: string | null): string {
  const date = parseDate(value);

  if (!date) {
    return '–';
  }

  return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function weekday(value?: string | null): string {
  return parseDate(value)?.toLocaleDateString('de-DE', { weekday: 'long' }) ?? '';
}

export function timeRange(start?: string | null, end?: string | null): string {
  const from = start?.slice(0, 5);
  const to = end?.slice(0, 5);

  if (from && to) {
    return `${from} – ${to} Uhr`;
  }

  const single = from ?? to;

  return single ? `${single} Uhr` : '';
}

export function personName(person?: PersonDto | null): string {
  return [person?.firstName, person?.lastName].filter(Boolean).join(' ');
}

export function initials(person?: PersonDto | null): string {
  return [person?.firstName, person?.lastName]
    .map(part => part?.trim().charAt(0).toUpperCase() ?? '')
    .join('');
}

export function isGameDay(training?: Pick<TrainingDto, 'type'> | null): boolean {
  return training?.type === TrainingType.GameDay;
}

/** Title shown for a training: custom title (game days) or a generic label. */
export function trainingTitle(training: Pick<TrainingDto, 'type' | 'title'>): string {
  if (training.title?.trim()) {
    return training.title.trim();
  }

  return isGameDay(training) ? 'Spielfest' : 'Training';
}

/** Where to go when a training is opened. */
export function trainingLink(training: Pick<TrainingDto, 'id' | 'type'>): string[] {
  return ['/trainings', training.id ?? '', isGameDay(training) ? 'game-day' : 'attendance'];
}

export function ageOn(birthDate?: string | null, today = new Date()): number | null {
  const [year, month, day] = (birthDate ?? '').slice(0, 10).split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  let age = today.getFullYear() - year;

  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--;
  }

  return age >= 0 ? age : null;
}

function parseDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}
