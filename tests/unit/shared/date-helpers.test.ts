import { formatDate, formatDateTime, getRelativeTime } from '@/shared/utils/date-helpers';

describe('date helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats dates and date-times for display', () => {
    expect(formatDate('2026-03-09T00:00:00.000Z')).toBe('Mar 9, 2026');
    expect(formatDateTime('2026-03-09T14:30:00.000Z')).toContain('Mar 9, 2026');
  });

  it('returns relative times for recent content', () => {
    expect(getRelativeTime('2026-03-09T11:59:45.000Z')).toBe('just now');
    expect(getRelativeTime('2026-03-09T11:55:00.000Z')).toBe('5m ago');
    expect(getRelativeTime('2026-03-09T10:00:00.000Z')).toBe('2h ago');
    expect(getRelativeTime('2026-03-06T12:00:00.000Z')).toBe('3d ago');
  });

  it('falls back to N/A for missing values', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDateTime(undefined)).toBe('N/A');
    expect(getRelativeTime(null)).toBe('N/A');
  });
});
