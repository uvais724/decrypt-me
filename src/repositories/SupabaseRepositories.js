import { supabase } from '../lib/supabaseClient';

// Repository Pattern: components depend on intention-revealing methods instead
// of Supabase table details.
export class GameRepository {
  constructor(client = supabase) {
    this.client = client;
  }

  async findInProgressGame(gameId) {
    const { data, error } = await this.client
      .from('games')
      .select(`
        game_id,
        prompts!inner(prompt_text)
      `)
      .eq('game_id', gameId)
      .eq('status', 'IN_PROGRESS')
      .single();

    if (error) throw error;
    return data;
  }

  async countInProgressFromSenderToReceiver(senderId, receiverId) {
    const { data, error } = await this.client
      .from('games')
      .select('*, prompts!inner(*)')
      .eq('prompts.sender_id', senderId)
      .eq('prompts.receiver_id', receiverId)
      .eq('status', 'IN_PROGRESS');

    if (error) throw error;
    return data?.length ?? 0;
  }

  async createSinglePlayerGame(promptId, difficulty) {
    const { data, error } = await this.client
      .from('games')
      .insert({
        prompt_id: promptId,
        difficulty_level: difficulty
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createNewGameViaRpc(payload) {
    const { data, error } = await this.client.rpc('create_new_game', payload);
    if (error) throw error;
    return data;
  }

  async markSolved(gameId) {
    const { error } = await this.client
      .from('games')
      .update({
        status: 'SOLVED',
        solved_at: new Date().toISOString()
      })
      .eq('game_id', gameId);

    if (error) throw error;
  }

  async markGaveUp(gameId) {
    const { error } = await this.client
      .from('games')
      .update({ status: 'GAVE_UP' })
      .eq('game_id', gameId);

    if (error) throw error;
  }

  async deleteGame(gameId) {
    const { error } = await this.client
      .from('games')
      .delete()
      .eq('game_id', gameId);

    if (error) throw error;
  }

  async findPromptId(gameId) {
    const { data, error } = await this.client
      .from('games')
      .select('prompt_id')
      .eq('game_id', gameId)
      .single();

    if (error) throw error;
    return data?.prompt_id;
  }
}

export class GameSessionRepository {
  constructor(client = supabase) {
    this.client = client;
  }

  async findByGameId(gameId) {
    const { data, error } = await this.client
      .from('game_sessions')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error) throw error;
    return data;
  }

  async findByMessageAndUser(message, userId) {
    const { data, error } = await this.client
      .from('game_sessions')
      .select('game_id')
      .eq('message', message)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async create(record) {
    const { error } = await this.client.from('game_sessions').insert(record);
    if (error) throw error;
  }

  async updateProgress(sessionId, userId, progress) {
    let query = this.client
      .from('game_sessions')
      .update({
        guesses: progress.guesses,
        revealed_indices: progress.revealedIndices,
        hints_used: progress.hintsUsed,
        lives: progress.lives,
        active_index: progress.activeIndex,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async reset(sessionId, resetSession) {
    const { data, error } = await this.client
      .from('game_sessions')
      .update({
        revealed_indices: resetSession.revealedIndices,
        hints_used: resetSession.hintsUsed,
        lives: resetSession.lives,
        active_index: resetSession.activeIndex,
        guesses: resetSession.guesses
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBySessionId(sessionId) {
    const { error } = await this.client
      .from('game_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
  }

  async deleteByGameId(gameId) {
    const { error } = await this.client
      .from('game_sessions')
      .delete()
      .eq('game_id', gameId);

    if (error) throw error;
  }
}

export class DailyPuzzleRepository {
  constructor(client = supabase) {
    this.client = client;
  }

  async findPuzzleByDate(puzzleDate) {
    const { data, error } = await this.client
      .from('daily_puzzles')
      .select('*')
      .eq('puzzle_date', puzzleDate)
      .single();

    if (error) throw error;
    return data;
  }

  async findAttempt(userId, puzzleDate) {
    const { data } = await this.client
      .from('daily_puzzle_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('puzzle_date', puzzleDate)
      .single();

    return data;
  }

  async saveAttempt(record) {
    const { data, error } = await this.client
      .from('daily_puzzle_attempts')
      .upsert(record);

    if (error) throw error;
    return data;
  }
}

export class RelationshipRepository {
  constructor(client = supabase) {
    this.client = client;
  }

  async findAcceptedForUser(userId) {
    const { data, error } = await this.client
      .from('user_relationships')
      .select(`
        status,
        user:users!user_relationships_user_id_fkey (user_id, username),
        related_user:users!user_relationships_related_user_id_fkey (user_id, username)
      `)
      .or(`user_id.eq.${userId},related_user_id.eq.${userId}`)
      .eq('status', 'ACCEPTED');

    if (error) throw error;

    return (data ?? []).map((relationship) => (
      relationship.user.user_id === userId ? relationship.related_user : relationship.user
    ));
  }
}

export class SinglePlayerRepository {
  constructor(client = supabase) {
    this.client = client;
  }

  async findProgress(userId) {
    const { data, error } = await this.client
      .from('single_player_progress')
      .select(`
        current_level,
        single_player_levels!inner (
          level_number,
          prompts!inner (
            prompt_id,
            prompt_text
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async findCurrentPrompt(userId) {
    const { data, error } = await this.client
      .from('single_player_progress')
      .select(`
        current_level,
        single_player_levels!inner (
          level_number,
          prompts!inner (
            prompt_id
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateLevel(userId, nextLevel) {
    const { error } = await this.client
      .from('single_player_progress')
      .update({ current_level: nextLevel })
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const repositories = {
  games: new GameRepository(),
  sessions: new GameSessionRepository(),
  dailyPuzzles: new DailyPuzzleRepository(),
  relationships: new RelationshipRepository(),
  singlePlayer: new SinglePlayerRepository()
};
