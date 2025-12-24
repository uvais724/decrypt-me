// Import required modules
import fs from 'fs'; // For reading SQL file
import { fileURLToPath } from 'url';
import { dirname, join } from 'path'; // For handling file paths
import client from '../db/dbConn.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Async function to setup the database
async function setupDatabase() {
    try {
        await client.connect(); // Connect to the database

        // Read SQL setup file
        const sql = fs.readFileSync(
            join(__dirname, 'setup-db.sql'),
            'utf8'
        );

        // Execute SQL queries from the file
        await client.query(sql);
        console.log('Database setup completed.');
    } catch (err) {
        // Handle errors during setup
        console.error('Error setting up database:', err);
    } finally {
        // Close the database connection
        await client.end();
    }
}

// Run the setup
setupDatabase();