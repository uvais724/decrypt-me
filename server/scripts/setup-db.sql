-- Create Prompts table
CREATE TABLE Prompts (
    prompt_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    prompt_text VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Games table
CREATE TABLE Games (
    game_id SERIAL PRIMARY KEY,
    prompt_id INT REFERENCES Prompts(prompt_id) ON DELETE CASCADE,
    lives_left INT DEFAULT 3,
    hints_used INT DEFAULT 0,
    difficulty_level VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solved_at TIMESTAMP NULL
);