import { contentFilterSchema, contentSchema, userProfileSchema } from '@/shared/utils/validation';

describe('validation schemas', () => {
  it('accepts a valid content payload from the create form', () => {
    const result = contentSchema.safeParse({
      title: 'Campus Advisory',
      description: 'Classes are suspended in the afternoon due to weather.',
      visibility: 'PUBLIC',
      tags: ['general', 'emergency'],
      org_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects malformed scheduled_at timestamps', () => {
    const result = contentSchema.safeParse({
      title: 'Campus Advisory',
      description: 'Classes are suspended in the afternoon due to weather.',
      visibility: 'PUBLIC',
      scheduled_at: 'not-a-date',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid avatar URLs in user profiles', () => {
    const result = userProfileSchema.safeParse({
      display_name: 'Campus User',
      avatar_url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('applies default pagination values to content filters', () => {
    const result = contentFilterSchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});
