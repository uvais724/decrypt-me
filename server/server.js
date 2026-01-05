// Import required modules
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();

// Import database client and configuration
import client from './db/dbConn.js';
import { PORT, FRONTEND_URL } from './config.js';
import requireAuth from './middlewares/auth-middleware.js';

// Connect to the database and start the server
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Database connection error:', error);
});

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Enable Cross-Origin Resource Sharing
app.use(cors());

// HTTP request logger middleware
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  const queryResult = await client.query('SELECT * FROM users WHERE username = $1', [username]);
  if (queryResult.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  const user = queryResult.rows[0];
  const token = jwt.sign({ userId: user.user_id, username: user.username }, process.env.SECRET);
  res.json({ token });
});

app.post('/api/invites/accept', async (req, res) => {
  const token = req.query.token;
  let userId;

  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const { rows } = await client.query(
    `SELECT * FROM relationship_invites
     WHERE token_hash = $1
       AND status = 'PENDING'
       AND expires_at > NOW()`,
    [tokenHash]
  );

  if (!rows.length) {
    return res.status(400).json({ error: "Invalid or expired invite" });
  }

  const invite = rows[0];
  //check if the invitee username exists
  const inviteeResult = await client.query(
    `SELECT * FROM users WHERE username = $1`,
    [invite.invitee_username]
  );

  if (inviteeResult.rows.length === 0) {
    //create user if not exists
    const newUserResult = await client.query(
      `INSERT INTO users (username) VALUES ($1) RETURNING *`,
      [invite.invitee_username]
    );
    userId = newUserResult.rows[0].user_id;
  } else {
    userId = inviteeResult.rows[0].user_id;
  }

  // Create relationship
  await client.query(
    `INSERT INTO user_relationships
     (user_id, related_user_id, relationship_type, status, initiated_by)
     VALUES ($1, $2, $3, 'accepted', $4),
     ($2, $1, $3, 'accepted', $1)
     ON CONFLICT DO NOTHING
     RETURNING relationship_id`,
    [
      invite.inviter_id,
      userId,
      invite.relationship_type,
      invite.inviter_id
    ]
  );

  // Mark invite accepted
  await client.query(
    `UPDATE relationship_invites
     SET status = 'ACCEPTED', accepted_at = NOW()
     WHERE invite_id = $1`,
    [invite.invite_id]
  );

  res.json({ success: true });
});


// Middleware to verify auth token
app.use(requireAuth);

app.get('/api/games/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const queryResult = await client.query('SELECT p.prompt_text FROM games g join prompts p ON g.prompt_id = p.prompt_id WHERE g.game_id = $1 and status = $2', [gameId, 'in_progress']);
  res.json(queryResult.rows[0]);
});

app.get('/api/games/list/:userId', async (req, res) => {
  const userId = req.params.userId;
  const queryResult = await client.query('SELECT g.game_id, g.lives_left, g.hints_used, g.difficulty_level, p.prompt_text, u.username, s.revealed_indices FROM games g join prompts p ON g.prompt_id = p.prompt_id join users u on u.user_id = p.sender_id join game_sessions s on s.game_id = g.game_id WHERE g.status = $1 and p.receiver_id = $2', ['in_progress', userId]);
  res.json(queryResult.rows);
});

app.put('/api/games/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const status = req.body.status;
  const queryResult = await client.query('UPDATE games SET status = $1, solved_at = NOW() WHERE game_id = $2 RETURNING *', [status, gameId]);
  res.json(queryResult.rows[0]);
});

app.get('/api/game/session/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const queryResult = await client.query('SELECT * from game_sessions WHERE game_id = $1', [gameId]);
  res.json(queryResult.rows[0]);
});


app.post('/api/game/session', async (req, res) => {
  const gameId = req.body.gameId;
  const userId = req.body.userId;
  const message = req.body.message;
  const cryptogramMap = JSON.stringify(req.body.cryptogramMap);
  const guesses = JSON.stringify(req.body.guesses);
  const activeIndex = req.body.activeIndex;
  const revealedIndices = JSON.stringify(req.body.revealedIndices);
  const hintsUsed = req.body.hintsUsed;
  const livesLeft = req.body.livesLeft;
  const status = 'IN_PROGRESS';
  const createdAt = new Date().toISOString();

  const queryResult = await client.query(
    'INSERT INTO game_sessions (game_id, user_id, message, cryptogram_map, revealed_indices, guesses, active_index, lives, hints_used, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
    [gameId, userId, message, cryptogramMap, revealedIndices, guesses, activeIndex, livesLeft, hintsUsed, status, createdAt]
  );
  res.json(queryResult.rows[0]);
});

//api to persist game state
app.patch('/api/game/session/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  const guesses = JSON.stringify(req.body.guesses);
  const revealedIndices = JSON.stringify(req.body.revealedIndices);
  const hintsUsed = req.body.hintsUsed;
  const livesLeft = req.body.livesLeft;

  const queryResult = await client.query(
    'UPDATE game_sessions SET guesses = $1, revealed_indices = $2, lives = $3, hints_used = $4, updated_at = NOW() WHERE session_id = $5 RETURNING *',
    [guesses, revealedIndices, livesLeft, hintsUsed, sessionId]
  );
  res.json(queryResult.rows[0]);
});

app.post('/api/games/new-game', async (req, res) => {
  const promptText = req.body.promptText;
  const userId = req.body.userId;
  const recipientId = req.body.recipientId;

  //check if 5 games in progress exist for this user with the same sender and receiver
  const existingGamesResult = await client.query(
    `SELECT COUNT(*) FROM games g
    JOIN prompts p ON g.prompt_id = p.prompt_id
    WHERE g.status = 'in_progress' AND p.sender_id = $1`,
    [userId]
  );

  if (existingGamesResult.rows[0].count > 5) {
    return res.status(400).json({ error: 'Maximum number of games in progress reached' });
  }

  const promptResult = await client.query(
    'INSERT INTO prompts (sender_id, prompt_text, type, created_at, receiver_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, promptText, 'custom', new Date().toISOString(), recipientId]
  );
  //check if the prompt was created
  if (promptResult.rows.length === 0) {
    return res.status(500).json({ error: 'Failed to create prompt' });
  }

  const promptId = promptResult.rows[0].prompt_id;
  const difficulty_level = setDifficultyLevel(promptText);

  const gameResult = await client.query(
    'INSERT INTO games (prompt_id, status, difficulty_level) VALUES ($1, $2, $3) RETURNING *',
    [promptId, 'in_progress', difficulty_level]
  );

  if (gameResult.rows.length === 0) {
    await client.query('DELETE FROM prompts WHERE prompt_id = $1', [promptId]);
    return res.status(500).json({ error: 'Failed to create game' });
  }

  res.json(`Game: ${gameResult.rows[0].game_id} created successfully`);
});

app.get('/api/users/related/:userId', async (req, res) => {
  const userId = req.params.userId;
  const queryResult = await client.query('SELECT u.user_id, u.username FROM users u JOIN user_relationships r ON u.user_id = r.related_user_id WHERE r.user_id = $1 and r.status = $2', [userId, 'accepted']);
  res.json(queryResult.rows);
});

app.delete('/api/game/session/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  await client.query('DELETE FROM game_sessions WHERE session_id = $1', [sessionId]);
  res.json({ message: 'Game session deleted successfully' });
});

//invite api
app.post('/api/invites/send', async (req, res) => {
  const { userId, inviteeUsername, relationshipType } = req.body;
  //const inviteId = uuidv4();

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await client.query(
    `INSERT INTO relationship_invites
     (inviter_id, invitee_username, relationship_type, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, inviteeUsername, relationshipType, tokenHash, expiresAt]
  );
  const magicLink = `${FRONTEND_URL}/invite/accept?token=${token}`;
  res.json({ magicLink });
});

function setDifficultyLevel(promptText) {
  //calculate word count by only counting letters A-Z
  const wordCount = promptText.match(/[a-zA-Z]/g)?.length || 0;
  if (wordCount < 50) return 'easy';
  if (wordCount <= 100) return 'medium';
  return 'hard';
}