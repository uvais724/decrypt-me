// Import the Client class from the 'pg' (PostgreSQL) library
import { Client } from 'pg';

// Import database configuration variables from the config file
import { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } from '../config.js';

// Create and export a new PostgreSQL client instance using the imported configuration
const client = new Client({
  host: DB_HOST,       // Database host address
  port: DB_PORT,       // Database port number
  database: DB_NAME,   // Name of the database
  user: DB_USER,       // Database user
  password: DB_PASSWORD // Database user's password
});

export default client;