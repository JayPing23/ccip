import { appendUuidToSlug, generateSlug } from '@/shared/utils/slugify';

describe('slugify utilities', () => {
  it('normalizes titles into URL-safe slugs', () => {
    expect(generateSlug('  Enrollment Deadline: AY 2026 / 2027  ')).toBe(
      'enrollment-deadline-ay-2026-2027'
    );
  });

  it('appends a four-character hex suffix to resolve collisions', () => {
    expect(appendUuidToSlug('enrollment-deadline')).toMatch(/^enrollment-deadline-[0-9a-f]{4}$/);
  });
});
