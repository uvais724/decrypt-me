// Load environment variables from .env file
import 'dotenv/config';

// Database configuration variables
export const DB_HOST = process.env.DB_HOST;       // Database host
export const DB_PORT = process.env.DB_PORT;       // Database port
export const DB_USER = process.env.DB_USER;       // Database username
export const DB_PASSWORD = process.env.DB_PASSWORD; // Database password
export const DB_NAME = process.env.DB_NAME;       // Database name

// Application port
export const PORT = process.env.PORT;             // Server listening port

export const SECRET = process.env.SECRET;       // Secret key for JWT
