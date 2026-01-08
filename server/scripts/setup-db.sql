CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--Create Users table
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to populate user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.email
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();


-- Create Prompts table
CREATE TABLE public.prompts (
    prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL
        REFERENCES public.users(user_id)
        ON DELETE CASCADE,
    receiver_id UUID NOT NULL
        REFERENCES public.users(user_id)
        ON DELETE CASCADE,
    prompt_text VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Create Games table
CREATE TABLE public.games (
    game_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL
        REFERENCES public.prompts(prompt_id)
        ON DELETE CASCADE,
    lives_left INT DEFAULT 3 CHECK (lives_left >= 0),
    hints_used INT DEFAULT 0 CHECK (hints_used >= 0),
    difficulty_level VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('IN_PROGRESS', 'SOLVED', 'GAVE_UP')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    solved_at TIMESTAMPTZ
);


-- Create Game Sessions
CREATE TABLE public.game_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL
        REFERENCES public.games(game_id)
        ON DELETE CASCADE,
    user_id UUID NOT NULL
        REFERENCES public.users(user_id)
        ON DELETE CASCADE,
    message TEXT NOT NULL,
    cryptogram_map JSONB NOT NULL,
    revealed_indices JSONB NOT NULL,
    guesses JSONB NOT NULL,
    active_index INTEGER NOT NULL,
    lives INTEGER NOT NULL CHECK (lives >= 0),
    hints_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE TABLE public.user_relationships (
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
CREATE TABLE public.relationship_invites (
    invite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    invitee_id  UUID NOT NULL
        REFERENCES users(user_id),
    relationship_type relationship_type NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- Enabling row level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_invites ENABLE ROW LEVEL SECURITY;

-- User policy
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Prompts policy
CREATE POLICY "Users can view their prompts"
ON public.prompts
FOR SELECT
USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
);

CREATE POLICY "Users can create prompts"
ON public.prompts
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Relationships policy
CREATE POLICY "Users can view relationships"
ON public.user_relationships
FOR SELECT
USING (
    auth.uid() = user_id OR
    auth.uid() = related_user_id
);

CREATE POLICY "Users can create relationships"
ON public.user_relationships
FOR INSERT
WITH CHECK (auth.uid() = initiated_by);


-- Relationships invite policy
CREATE POLICY "Inviter can manage invites"
ON public.relationship_invites
FOR ALL
USING (auth.uid() = inviter_id)
WITH CHECK (auth.uid() = inviter_id);