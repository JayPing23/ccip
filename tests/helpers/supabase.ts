import type { createServerSupabaseClient } from '@/shared/lib/supabase-server';

type SupabaseError = {
  message: string;
  code?: string;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export interface SupabaseQueryResult<T> {
  data: T;
  error: SupabaseError | null;
  count?: number | null;
}

export interface MockQueryBuilder<T> extends PromiseLike<SupabaseQueryResult<T>> {
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  neq: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
  single: jest.Mock;
}

export interface SupabaseClientMock {
  from: jest.Mock;
  auth: {
    getUser: jest.Mock;
    signOut: jest.Mock;
  };
}

export function createQueryBuilder<T>(result: SupabaseQueryResult<T>): MockQueryBuilder<T> {
  const builder = {} as MockQueryBuilder<T>;

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.is = jest.fn(() => builder);
  builder.neq = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.range = jest.fn(() => builder);
  builder.insert = jest.fn(() => builder);
  builder.update = jest.fn(() => builder);
  builder.upsert = jest.fn(() => builder);
  builder.single = jest.fn(() => builder);
  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);

  return builder;
}

export function createSupabaseClientMock(): SupabaseClientMock {
  return {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };
}

export function asServerSupabaseClient(client: unknown): ServerSupabaseClient {
  return client as ServerSupabaseClient;
}
