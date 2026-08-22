import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {},
}));

const terminalResult = (data = null, error = null) => ({ data, error });

function createQuery(result = terminalResult()) {
  const query = {
    calls: [],
    select(...args) {
      this.calls.push(['select', ...args]);
      return this;
    },
    eq(...args) {
      this.calls.push(['eq', ...args]);
      return this;
    },
    neq(...args) {
      this.calls.push(['neq', ...args]);
      return this;
    },
    or(...args) {
      this.calls.push(['or', ...args]);
      return this;
    },
    order(...args) {
      this.calls.push(['order', ...args]);
      return this;
    },
    limit(...args) {
      this.calls.push(['limit', ...args]);
      return this;
    },
    insert(...args) {
      this.calls.push(['insert', ...args]);
      return this;
    },
    update(...args) {
      this.calls.push(['update', ...args]);
      return this;
    },
    delete(...args) {
      this.calls.push(['delete', ...args]);
      return this;
    },
    upsert(...args) {
      this.calls.push(['upsert', ...args]);
      return this;
    },
    single() {
      this.calls.push(['single']);
      return Promise.resolve(result);
    },
    maybeSingle() {
      this.calls.push(['maybeSingle']);
      return Promise.resolve(result);
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };

  return query;
}

function createClient(queryResult = terminalResult()) {
  const queries = [];
  const client = {
    queries,
    from: vi.fn((table) => {
      const query = createQuery(queryResult);
      query.table = table;
      queries.push(query);
      return query;
    }),
    rpc: vi.fn(() => Promise.resolve(queryResult)),
  };

  return client;
}

describe('Supabase repositories', () => {
  let repositories;

  beforeEach(async () => {
    vi.clearAllMocks();
    repositories = await import('./SupabaseRepositories');
  });

  it('counts in-progress games sent from one user to another', async () => {
    const client = createClient(terminalResult([{ game_id: 1 }, { game_id: 2 }]));
    const repo = new repositories.GameRepository(client);

    await expect(repo.countInProgressFromSenderToReceiver('sender', 'receiver')).resolves.toBe(2);

    expect(client.from).toHaveBeenCalledWith('games');
    expect(client.queries[0].calls).toEqual(expect.arrayContaining([
      ['eq', 'prompts.sender_id', 'sender'],
      ['eq', 'prompts.receiver_id', 'receiver'],
      ['eq', 'status', 'IN_PROGRESS'],
    ]));
  });

  it('creates a new game through the RPC and returns its id', async () => {
    const payload = { p_sender_id: 'sender' };
    const client = createClient(terminalResult('game-1'));
    const repo = new repositories.GameRepository(client);

    await expect(repo.createNewGameViaRpc(payload)).resolves.toBe('game-1');
    expect(client.rpc).toHaveBeenCalledWith('create_new_game', payload);
  });

  it('marks games solved with an ISO solved timestamp', async () => {
    const client = createClient();
    const repo = new repositories.GameRepository(client);

    await repo.markSolved('game-1');

    const updateCall = client.queries[0].calls.find(([name]) => name === 'update');
    expect(updateCall[1]).toMatchObject({ status: 'SOLVED' });
    expect(new Date(updateCall[1].solved_at).toString()).not.toBe('Invalid Date');
    expect(client.queries[0].calls).toContainEqual(['eq', 'game_id', 'game-1']);
  });

  it('persists session progress and scopes by user when provided', async () => {
    const client = createClient();
    const repo = new repositories.GameSessionRepository(client);

    await repo.updateProgress('session-1', 'user-1', {
      guesses: { 0: 'A' },
      revealedIndices: [0],
      hintsUsed: 1,
      lives: 2,
      activeIndex: 4,
    });

    const calls = client.queries[0].calls;
    expect(calls).toContainEqual(['eq', 'session_id', 'session-1']);
    expect(calls).toContainEqual(['eq', 'user_id', 'user-1']);
    expect(calls.find(([name]) => name === 'update')[1]).toMatchObject({
      guesses: { 0: 'A' },
      revealed_indices: [0],
      hints_used: 1,
      lives: 2,
      active_index: 4,
    });
  });

  it('resets a session and returns the updated row', async () => {
    const client = createClient(terminalResult({ session_id: 'session-1', lives: 3 }));
    const repo = new repositories.GameSessionRepository(client);

    await expect(repo.reset('session-1', {
      revealedIndices: [0],
      hintsUsed: 0,
      lives: 3,
      activeIndex: 1,
      guesses: {},
    })).resolves.toEqual({ session_id: 'session-1', lives: 3 });
  });

  it('loads daily attempts without throwing when Supabase returns no row', async () => {
    const client = createClient(terminalResult(null, { code: 'PGRST116' }));
    const repo = new repositories.DailyPuzzleRepository(client);

    await expect(repo.findAttempt('user-1', '2026-08-22')).resolves.toBeNull();
  });

  it('maps accepted relationships to the other user', async () => {
    const client = createClient(terminalResult([
      {
        user: { user_id: 'me', username: 'Me' },
        related_user: { user_id: 'you', username: 'You' },
      },
      {
        user: { user_id: 'them', username: 'Them' },
        related_user: { user_id: 'me', username: 'Me' },
      },
    ]));
    const repo = new repositories.RelationshipRepository(client);

    await expect(repo.findAcceptedForUser('me')).resolves.toEqual([
      { user_id: 'you', username: 'You' },
      { user_id: 'them', username: 'Them' },
    ]);
  });

  it('allows missing single-player progress rows for current prompt lookup', async () => {
    const client = createClient(terminalResult(null, { code: 'PGRST116' }));
    const repo = new repositories.SinglePlayerRepository(client);

    await expect(repo.findCurrentPrompt('user-1')).resolves.toBeNull();
  });

  it('throws repository errors for failed writes', async () => {
    const error = new Error('write failed');
    const client = createClient(terminalResult(null, error));
    const repo = new repositories.GameRepository(client);

    await expect(repo.markGaveUp('game-1')).rejects.toBe(error);
  });
});
