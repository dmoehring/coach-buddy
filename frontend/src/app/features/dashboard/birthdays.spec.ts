import { describe, expect, it } from 'vitest';

import { BirthdayCandidate, findBirthdaysAround } from './birthdays';

const candidate = (name: string, birthDate: string): BirthdayCandidate => ({
  personId: name,
  name,
  birthDate
});

describe('findBirthdaysAround', () => {
  const today = new Date(2026, 9, 25);

  it('returns birthdays inside the window ordered by date', () => {
    const result = findBirthdaysAround(
      [
        candidate('Spaeter', '2017-10-30'),
        candidate('Heute', '2016-10-25'),
        candidate('Frueher', '2015-10-20'),
        candidate('Zu weit', '2015-11-20')
      ],
      today,
      7
    );

    expect(result.map(birthday => birthday.name)).toEqual(['Frueher', 'Heute', 'Spaeter']);
    expect(result.map(birthday => birthday.daysFromToday)).toEqual([-5, 0, 5]);
    expect(result.map(birthday => birthday.turnsAge)).toEqual([11, 10, 9]);
  });

  it('includes the window boundaries', () => {
    const result = findBirthdaysAround(
      [candidate('Vor', '2015-10-18'), candidate('Nach', '2015-11-01'), candidate('Raus', '2015-11-02')],
      today,
      7
    );

    expect(result.map(birthday => birthday.name)).toEqual(['Vor', 'Nach']);
  });

  it('handles windows that span the new year', () => {
    const result = findBirthdaysAround(
      [candidate('Silvester', '2016-12-30'), candidate('Neujahr', '2016-01-03')],
      new Date(2026, 0, 1),
      7
    );

    expect(result.map(birthday => [birthday.name, birthday.daysFromToday, birthday.turnsAge])).toEqual([
      ['Silvester', -2, 9],
      ['Neujahr', 2, 10]
    ]);
  });

  it('celebrates a leap day on 28 February in other years', () => {
    const result = findBirthdaysAround([candidate('Schaltkind', '2016-02-29')], new Date(2027, 1, 27), 7);

    expect(result).toHaveLength(1);
    expect(result[0].daysFromToday).toBe(1);
    expect(result[0].turnsAge).toBe(11);
  });

  it('skips invalid and not yet born dates', () => {
    const result = findBirthdaysAround(
      [candidate('Kaputt', 'abc'), candidate('Zukunft', '2030-10-25')],
      today,
      7
    );

    expect(result).toEqual([]);
  });
});
