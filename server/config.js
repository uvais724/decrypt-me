// Load environment variables from .env file
import 'dotenv/config';

// Supabase configuration variables
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

//Server Port
export const PORT = process.env.PORT;

