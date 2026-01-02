-- Create Prompts table
CREATE TABLE Prompts (
    prompt_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    receiver_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
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
    session_id SERIAL PRIMARY KEY,
    game_id         INT NOT NULL REFERENCES Games(game_id) ON DELETE CASCADE,
    user_id         INT REFERENCES Users(user_id) ON DELETE CASCADE,
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


-- Enum for relationship type
CREATE TYPE relationship_type AS ENUM (
    'partner',
    'friend',
    'family',
    'other'
);

-- Enum for relationship status
CREATE TYPE relationship_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'blocked'
);


-- Create User Relationships table
CREATE TABLE user_relationships (
    relationship_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    related_user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    relationship_type relationship_type NOT NULL,

    status relationship_status DEFAULT 'pending',

    initiated_by INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent self-relationships
    CONSTRAINT no_self_relationship
        CHECK (user_id <> related_user_id)
);


CREATE UNIQUE INDEX ux_user_relationship_pair
ON user_relationships (
    LEAST(user_id, related_user_id),
    GREATEST(user_id, related_user_id)
);

GRANT ALL PRIVILEGES ON DATABASE decrypt_me TO db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_user;