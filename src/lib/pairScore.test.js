import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = {
  from: vi.fn(),
  select: vi.fn(),
  or: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
};

const supabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('./supabaseClient', () => ({
  supabase,
}));

describe('pairScore', () => {
  let module;

  beforeEach(async () => {
    vi.clearAllMocks();
    query.select.mockReturnValue(query);
    query.or.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    supabase.from.mockReturnValue(query);
    module = await import('./pairScore');
  });

  it('fetches the current score for either user ordering', async () => {
    query.maybeSingle.mockResolvedValue({ data: { current_score: '7' }, error: null });

    await expect(module.fetchPairCurrentScore('u1', 'u2')).resolves.toBe(7);

    expect(supabase.from).toHaveBeenCalledWith('user_pair_scores');
    expect(query.or).toHaveBeenCalledWith(
      'and(user_one.eq.u1,user_two.eq.u2),and(user_one.eq.u2,user_two.eq.u1)'
    );
  });

  it('returns zero for missing, invalid, or errored scores', async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: { current_score: 'nope' }, error: null });
    await expect(module.fetchPairCurrentScore('u1', 'u2')).resolves.toBe(0);

    query.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('no row') });
    await expect(module.fetchPairCurrentScore('u1', 'u2')).resolves.toBe(0);
  });

  it('increments through RPC and returns previous/current score metadata', async () => {
    query.maybeSingle.mockResolvedValue({ data: { current_score: 4 }, error: null });
    supabase.rpc.mockResolvedValue({ error: null });

    await expect(module.incrementPairScoreWithPrevious('u1', 'u2', 3)).resolves.toEqual({
      previousScore: 4,
      currentScore: 7,
      incrementBy: 3,
    });
    expect(supabase.rpc).toHaveBeenCalledWith('increment_pair_score', {
      uid1: 'u1',
      uid2: 'u2',
      inc: 3,
    });
  });

  it('throws when the increment RPC fails', async () => {
    const error = new Error('rpc failed');
    query.maybeSingle.mockResolvedValue({ data: { current_score: 4 }, error: null });
    supabase.rpc.mockResolvedValue({ error });

    await expect(module.incrementPairScoreWithPrevious('u1', 'u2')).rejects.toBe(error);
  });
});
