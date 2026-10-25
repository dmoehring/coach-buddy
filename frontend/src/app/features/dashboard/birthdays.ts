export interface BirthdayCandidate {
  personId: string;
  name: string;
  birthDate: string;
  role?: string;
}

export interface Birthday {
  personId: string;
  name: string;
  role?: string;
  /** Der Geburtstag in dem betrachteten Zeitraum. */
  date: Date;
  /** Negativ: liegt in der Vergangenheit, 0: heute. */
  daysFromToday: number;
  /** Alter, das die Person an diesem Geburtstag erreicht. */
  turnsAge: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Liefert alle Geburtstage, die höchstens `windowDays` Tage vor oder nach `today` liegen,
 * sortiert vom ältesten zum jüngsten Termin.
 */
export function findBirthdaysAround(
  candidates: BirthdayCandidate[],
  today: Date,
  windowDays: number
): Birthday[] {
  const todayDay = toDayNumber(today.getFullYear(), today.getMonth(), today.getDate());
  const birthdays: Birthday[] = [];

  for (const candidate of candidates) {
    const [birthYear, birthMonth, birthDay] = candidate.birthDate.slice(0, 10).split('-').map(Number);

    if (!birthYear || !birthMonth || !birthDay) {
      continue;
    }

    // Der Zeitraum kann den Jahreswechsel überspannen, daher drei Jahre prüfen.
    for (let year = today.getFullYear() - 1; year <= today.getFullYear() + 1; year++) {
      if (year < birthYear) {
        continue;
      }

      const date = occurrenceInYear(year, birthMonth - 1, birthDay);
      const daysFromToday = toDayNumber(date.getFullYear(), date.getMonth(), date.getDate()) - todayDay;

      if (Math.abs(daysFromToday) <= windowDays) {
        birthdays.push({
          personId: candidate.personId,
          name: candidate.name,
          role: candidate.role,
          date,
          daysFromToday,
          turnsAge: year - birthYear
        });
      }
    }
  }

  return birthdays.sort((left, right) =>
    left.daysFromToday - right.daysFromToday || left.name.localeCompare(right.name, 'de')
  );
}

/** Ein 29. Februar wird in Nicht-Schaltjahren am 28. Februar gefeiert. */
function occurrenceInYear(year: number, month: number, day: number): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  return new Date(year, month, Math.min(day, lastDayOfMonth));
}

function toDayNumber(year: number, month: number, day: number): number {
  return Math.round(Date.UTC(year, month, day) / MS_PER_DAY);
}
