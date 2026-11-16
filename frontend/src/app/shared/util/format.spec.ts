import { ageOn, formatDate, formatShortDate, timeRange, trainingLink, trainingTitle } from './format';
import { TrainingType } from '../../api/model/training-type';

describe('format helpers', () => {
  it('formats ISO dates the German way', () => {
    expect(formatDate('2026-03-09')).toBe('09.03.2026');
    expect(formatDate(undefined)).toBe('–');
  });

  it('adds the weekday to short dates', () => {
    expect(formatShortDate('2026-03-10')).toContain('10.03.');
    expect(formatShortDate(null)).toBe('–');
  });

  it('builds time ranges from HH:mm:ss values', () => {
    expect(timeRange('17:30:00', '19:00:00')).toBe('17:30 – 19:00 Uhr');
    expect(timeRange('17:30:00', null)).toBe('17:30 Uhr');
    expect(timeRange(null, null)).toBe('');
  });

  it('names trainings and game days', () => {
    expect(trainingTitle({ type: TrainingType.Training })).toBe('Training');
    expect(trainingTitle({ type: TrainingType.GameDay })).toBe('Spielfest');
    expect(trainingTitle({ type: TrainingType.GameDay, title: ' Spielfest Nord ' })).toBe('Spielfest Nord');
  });

  it('links game days to their own page', () => {
    expect(trainingLink({ id: 'a', type: TrainingType.GameDay })).toEqual(['/trainings', 'a', 'game-day']);
    expect(trainingLink({ id: 'a', type: TrainingType.Training })).toEqual(['/trainings', 'a', 'attendance']);
  });

  it('calculates ages around the birthday', () => {
    expect(ageOn('2016-06-15', new Date(2026, 5, 14))).toBe(9);
    expect(ageOn('2016-06-15', new Date(2026, 5, 15))).toBe(10);
    expect(ageOn(undefined)).toBeNull();
  });
});
