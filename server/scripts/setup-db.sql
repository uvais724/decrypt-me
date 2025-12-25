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

-- Create Game Sessions
CREATE TABLE game_sessions (
    session_id      INTEGER PRIMARY KEY,
    game_id         INT NOT NULL REFERENCES Games(game_id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL,
    message         TEXT NOT NULL,
    cryptogram_map  JSONB NOT NULL,
    revealed_indices JSONB NOT NULL,
    guesses         JSONB NOT NULL,
    active_index    INTEGER NOT NULL,
    lives           INTEGER NOT NULL CHECK (lives >= 0),
    hints_used      INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL CHECK (
        status IN ('IN_PROGRESS', 'SOLVED', 'GAVE UP')
    ),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
