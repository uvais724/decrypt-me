--Create Users table
CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username UNIQUE TEXT NOT NULL
);

-- Create Prompts table
CREATE TABLE Prompts (
    prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    prompt_text VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Games table
CREATE TABLE Games (
    game_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID REFERENCES Prompts(prompt_id) ON DELETE CASCADE,
    lives_left INT DEFAULT 3,
    hints_used INT DEFAULT 0,
    difficulty_level VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solved_at TIMESTAMP NULL
);

-- Create Game Sessions
CREATE TABLE game_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         UUID NOT NULL REFERENCES Games(game_id) ON DELETE CASCADE,
    user_id         UUID REFERENCES Users(user_id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    cryptogram_map  JSONB NOT NULL,
    revealed_indices JSONB NOT NULL,
    guesses         JSONB NOT NULL,
    active_index    INTEGER NOT NULL,
    lives           INTEGER NOT NULL CHECK (lives >= 0),
    hints_used      INTEGER NOT NULL DEFAULT 0,
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

    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    related_user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    relationship_type relationship_type NOT NULL,

    status relationship_status DEFAULT 'pending',

    initiated_by UUID NOT NULL
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

-- Relationship Invite table
CREATE TABLE relationship_invites (
    invite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    inviter_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    invitee_username TEXT NOT NULL,

    relationship_type relationship_type NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

GRANT ALL PRIVILEGES ON DATABASE decrypt_me TO db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_user;