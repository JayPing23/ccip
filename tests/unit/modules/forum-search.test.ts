/** @jest-environment node */

import { searchForumThreads } from '@/modules/search/search.service';

jest.mock('@/shared/lib/supabase-server', () => {
  const mockRange = jest.fn();
  const mockOrder = jest.fn(() => ({ range: mockRange }));
  const mockOr = jest.fn(() => ({ order: mockOrder }));
  const mockIs = jest.fn(() => ({ or: mockOr, order: mockOrder }));
  const mockEq2 = jest.fn(() => ({ is: mockIs }));
  const mockSelect = jest.fn(() => ({ eq: mockEq2 }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));

  return {
    createServerSupabaseClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
    createServiceRoleClient: jest.fn(() => ({ from: mockFrom })),
    __mocks: { mockFrom, mockSelect, mockEq2, mockIs, mockOr, mockOrder, mockRange },
  };
});

const supabaseMocks = jest.requireMock('@/shared/lib/supabase-server').__mocks;

describe('search.service – searchForumThreads', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the chain for each test
    supabaseMocks.mockRange.mockResolvedValue({
      data: [
        {
          id: 'thread-1',
          category_id: 'cat-1',
          author_id: 'user-1',
          title: 'Test Thread',
          body: 'This is a test thread body',
          slug: 'test-thread',
          status: 'OPEN',
          pinned: false,
          reply_count: 0,
          created_at: '2026-03-09T10:00:00.000Z',
          updated_at: '2026-03-09T10:00:00.000Z',
          deleted_at: null,
        },
      ],
      count: 1,
      error: null,
    });

    // Re-chain mocks
    supabaseMocks.mockOrder.mockReturnValue({ range: supabaseMocks.mockRange });
    supabaseMocks.mockOr.mockReturnValue({ order: supabaseMocks.mockOrder });
    supabaseMocks.mockIs.mockReturnValue({
      or: supabaseMocks.mockOr,
      order: supabaseMocks.mockOrder,
    });
    supabaseMocks.mockEq2.mockReturnValue({ is: supabaseMocks.mockIs });
    supabaseMocks.mockSelect.mockReturnValue({ eq: supabaseMocks.mockEq2 });
  });

  it('returns matching threads with matchedFields', async () => {
    const result = await searchForumThreads({ query: 'test' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].thread.id).toBe('thread-1');
    expect(result.items[0].matchedFields).toContain('title');
    expect(result.items[0].matchedFields).toContain('body');
    expect(result.total).toBe(1);
  });

  it('returns empty matchedFields when no query is provided', async () => {
    const result = await searchForumThreads({});

    expect(result.items).toHaveLength(1);
    expect(result.items[0].matchedFields).toEqual([]);
  });
});
