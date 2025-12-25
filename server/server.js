// Import required modules
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
const app = express();

// Import database client and configuration
import client from './db/dbConn.js';
import { PORT } from './config.js';

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