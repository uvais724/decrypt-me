// Import required modules
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import jwt from 'jsonwebtoken';
const app = express();

// Import database client and configuration
import client from './db/dbConn.js';
import { PORT } from './config.js';
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

//Middleware to verify auth token
app.use(requireAuth);

app.get('/api/games/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const queryResult = await client.query('SELECT p.prompt_text FROM games g join prompts p ON g.prompt_id = p.prompt_id WHERE g.game_id = $1 and status = $2', [gameId, 'in_progress']);
  console.log(queryResult);
  res.json(queryResult.rows[0]);
});

app.get('/api/games', async (req, res) => {
  const queryResult = await client.query('SELECT * FROM games g join prompts p ON g.prompt_id = p.prompt_id WHERE g.status = $1', ['in_progress']);
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
  const userId = 49; // Placeholder user ID
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
  const promptResult = await client.query(
    'INSERT INTO prompts (sender_id, prompt_text, type, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
    [1, promptText, 'custom', new Date().toISOString()]
  );
  //check if the prompt was created
  if (promptResult.rows.length === 0) {
    return res.status(500).json({ error: 'Failed to create prompt' });
  }

  const promptId = promptResult.rows[0].prompt_id;
  const gameResult = await client.query(
    'INSERT INTO games (prompt_id, status, difficulty_level) VALUES ($1, $2, $3) RETURNING *',
    [promptId, 'in_progress', 'medium']
  );

  if (gameResult.rows.length === 0) {
    await client.query('DELETE FROM prompts WHERE prompt_id = $1', [promptId]);
    return res.status(500).json({ error: 'Failed to create game' });
  }

  res.json(`Game: ${gameResult.rows[0].game_id} created successfully`);

});