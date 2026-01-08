// Import required modules
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import crypto from 'crypto';
import supabase from './db/dbConn.js';

const app = express();

// Import database client and configuration
import { PORT } from './config.js';
import requireAuth from './middlewares/auth-middleware.js';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Enable Cross-Origin Resource Sharing
app.use(cors());

// HTTP request logger middleware
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Middleware to verify auth token
app.use(requireAuth);

app.get('/api/games/:gameId', requireAuth, async (req, res) => {
  const { gameId } = req.params;

  const { data, error } = await supabase
    .from('games')
    .select(`
      game_id,
      prompts!inner(prompt_text)
    `)
    .eq('game_id', gameId)
    .eq('status', 'IN_PROGRESS')
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ prompt_text: data.prompts.prompt_text });
});

app.post('/api/games/new-game', requireAuth, async (req, res) => {
  const { promptText, recipientId } = req.body;
  const userId = req.user.id;

  const { count } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'IN_PROGRESS');

  if (count > 5) {
    return res.status(400).json({ error: 'Max games reached' });
  }

  const { data: prompt } = await supabase
    .from('prompts')
    .insert({
      sender_id: userId,
      receiver_id: recipientId,
      prompt_text: promptText,
      type: 'custom'
    })
    .select()
    .single();

  const difficulty = setDifficultyLevel(promptText);

  const { data: game } = await supabase
    .from('games')
    .insert({
      prompt_id: prompt.prompt_id,
      difficulty_level: difficulty
    })
    .select()
    .single();

  res.json({ gameId: game.game_id });
});


app.get('/api/games/list/:userId', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await supabase
    .from('games')
    .select(`
      game_id,
      lives_left,
      hints_used,
      difficulty_level,
      status,
      prompts!inner (
        prompt_text,
        sender_id,
        users!prompts_sender_id_fkey(username)
      ),
      game_sessions (
        revealed_indices,
        lives,
        hints_used
      )
    `)
    .eq('prompts.receiver_id', userId)
    .eq('status', 'IN_PROGRESS');

  if (error) return res.status(400).json({ error: error.message });

  const formatted = data.map(g => ({
    game_id: g.game_id,
    difficulty_level: g.difficulty_level,
    prompt_text: g.prompts.prompt_text,
    sender: g.prompts.users.username,
    lives_left: g.game_sessions?.[0]?.lives ?? g.lives_left,
    hints_used: g.game_sessions?.[0]?.hints_used ?? g.hints_used,
    revealed_indices: g.game_sessions?.[0]?.revealed_indices ?? []
  }));

  res.json(formatted);
});


app.put('/api/games/:gameId', requireAuth, async (req, res) => {
  const { gameId } = req.params;
  const { status } = req.body;

  const { data, error } = await supabase
    .from('games')
    .update({
      status,
      solved_at: new Date().toISOString()
    })
    .eq('game_id', gameId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});


app.get('/api/game/session/:gameId', requireAuth, async (req, res) => {
  const { gameId } = req.params;

  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('game_id', gameId)
    .single();

  if (error) return res.status(404).json({ error: 'Session not found' });

  res.json(data);
});


app.post('/api/game/session', requireAuth, async (req, res) => {
  const {
    gameId,
    message,
    cryptogramMap,
    guesses,
    activeIndex,
    revealedIndices,
    hintsUsed,
    livesLeft
  } = req.body;

  const userId = req.user.id;

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      game_id: gameId,
      user_id: userId,
      message,
      cryptogram_map: cryptogramMap,
      guesses,
      revealed_indices: revealedIndices,
      active_index: activeIndex,
      hints_used: hintsUsed,
      lives: livesLeft,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});


//api to persist game state
app.patch('/api/game/session/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const { guesses, revealedIndices, hintsUsed, livesLeft } = req.body;

  const { data, error } = await supabase
    .from('game_sessions')
    .update({
      guesses,
      revealed_indices: revealedIndices,
      hints_used: hintsUsed,
      lives: livesLeft,
      updated_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.delete('/api/game/session/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;

  const { error } = await supabase
    .from('game_sessions')
    .delete()
    .eq('session_id', sessionId);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: 'Game session deleted successfully' });
});

app.get('/api/users/related', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('user_relationships')
    .select(`
      status,
      user:users!user_relationships_user_id_fkey (user_id, username),
      related_user:users!user_relationships_related_user_id_fkey (user_id, username)
    `)
    // Use .or to check both columns for the current user's ID
    .or(`user_id.eq.${userId},related_user_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) return res.status(400).json({ error: error.message });

  // Map through the results and return the user that is NOT the current user
  const relatedUsers = data.map(rel => {
    return rel.user.user_id === userId ? rel.related_user : rel.user;
  });

  res.json(relatedUsers);
});

app.post('/api/users/check', requireAuth, async (req, res) => {
  console.log('Logged in user: ', req.user);
  const loggedInUser = req.user;
  const username = req.body.username;
  if (!username) res.status(400).send('No username sent!');
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  if (data.user_id === loggedInUser.id) {
    return res.status(400).send('Sent username is exactly same as yours!');
  }

  console.log('user found: ', data);
  res.json(data);
});

//invite api
app.get('/api/invites', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
    .from('relationship_invites')
    .select(`
      invite_id, 
      inviter_id, 
      invitee_id, 
      relationship_type, 
      status, 
      created_at,
      inviter:users!inviter_id(username) // Get the name of the person who sent it
    `)
    .eq('invitee_id', userId) // Filter directly on the main table column
    .eq('status', 'PENDING');

    if (error) return res.status(400).json({ error: error.message });

    console.log('Invite Data: ', data);
    const formatted = data.map(i => ({
      invite_id: i.invite_id,
      inviter_id: i.inviter_id,
      inviter_username: i.inviter?.username,
      relationship_type: i.relationship_type,
      status: i.status,
      created_at: i.created_at
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong while fetching invites' });
  }
});

app.post('/api/invites/send', requireAuth, async (req, res) => {
  try {
    const { inviteeUserId, relationshipType } = req.body;
    const inviterId = req.user.id; // From your auth middleware

    const { data: inviteData, error: inviteError } = await supabase
      .from('relationship_invites')
      .insert({
        inviter_id: inviterId,
        invitee_id: inviteeUserId,
        relationship_type: relationshipType,
        status: 'PENDING'
      })
      .select();

    if (inviteError) return res.status(400).json({ error: inviteError.message });

    res.json({ message: 'Invite sent successfully', invite: inviteData?.[0] });
    
  } catch (err) {
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

app.post('/api/invites/accept/:inviteId', requireAuth, async (req, res) => {
  try {
    const inviteId = req.params.inviteId;

    const { data: invite, error: inviteErr } = await supabase
      .from('relationship_invites')
      .select('*')
      .eq('status', 'PENDING')
      .eq('invite_id', inviteId)
      .single();

    if (inviteErr || !invite) return res.status(400).json({ error: 'Invite not found' });

    if (invite.invitee_username !== req.user.username) {
      return res.status(403).json({ error: 'Not authorized to accept this invite' });
    }

    console.log('First pass: ', invite);

    const { data: invitee, error: inviteeErr } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', invite.invitee_id)
      .single();

    if (inviteeErr || !invitee) return res.status(400).json({ error: 'Invitee must sign up first' });

    console.log('Second pass: ', invitee);

    const { error: insertErr } = await supabase.from('user_relationships').insert({
      user_id: invite.inviter_id,
      related_user_id: invitee.user_id,
      relationship_type: invite.relationship_type,
      status: 'accepted',
      initiated_by: invite.inviter_id
    });

    if (insertErr) return res.status(400).json({ error: insertErr.message });

    console.log('Third pass: ', insertErr);

    const {error: updateError} = await supabase
      .from('relationship_invites')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString()
      })
      .eq('invite_id', invite.invite_id);
    
    console.log('Fourth pass: ', updateError);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

app.post('/api/invites/reject/:inviteId', requireAuth, async (req, res) => {
  try {
    const inviteId = req.params.inviteId;

    const { data: invite, error: inviteErr } = await supabase
      .from('relationship_invites')
      .select('*')
      .eq('status', 'PENDING')
      .eq('invite_id', inviteId)
      .single();

    if (inviteErr || !invite) return res.status(400).json({ error: 'Invite not found' });

    if (invite.invitee_username !== req.user.username) {
      return res.status(403).json({ error: 'Not authorized to reject this invite' });
    }

    await supabase
      .from('relationship_invites')
      .update({ status: 'REJECTED' })
      .eq('invite_id', invite.invite_id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject invite' });
  }
});

function setDifficultyLevel(promptText) {
  //calculate word count by only counting letters A-Z
  const wordCount = promptText.match(/[a-zA-Z]/g)?.length || 0;
  if (wordCount < 50) return 'easy';
  if (wordCount <= 100) return 'medium';
  return 'hard';
}