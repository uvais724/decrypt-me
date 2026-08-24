-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  email text,
  avatar_url text,
  user_id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.prompts (
  sender_id uuid,
  receiver_id uuid,
  prompt_text text NOT NULL,
  type character varying NOT NULL,
  prompt_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prompts_pkey PRIMARY KEY (prompt_id),
  CONSTRAINT prompts_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id),
  CONSTRAINT prompts_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.games (
  prompt_id uuid NOT NULL,
  difficulty_level character varying NOT NULL,
  solved_at timestamp with time zone,
  game_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status character varying DEFAULT 'IN_PROGRESS'::character varying CHECK (status::text = ANY (ARRAY['IN_PROGRESS'::character varying, 'SOLVED'::character varying, 'GAVE_UP'::character varying]::text[])),
  started_at timestamp with time zone DEFAULT now(),
  CONSTRAINT games_pkey PRIMARY KEY (game_id),
  CONSTRAINT games_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(prompt_id)
);
CREATE TABLE public.game_sessions (
  game_id uuid,
  user_id uuid NOT NULL,
  message text NOT NULL,
  cryptogram_map jsonb NOT NULL,
  revealed_indices jsonb NOT NULL,
  active_index integer NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  hints_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  lives integer NOT NULL DEFAULT 3 CHECK (lives >= 0),
  guesses jsonb,
  initial_revealed jsonb NOT NULL,
  CONSTRAINT game_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT game_sessions_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(game_id),
  CONSTRAINT game_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.user_relationships (
  user_id uuid NOT NULL,
  related_user_id uuid NOT NULL,
  relationship_type USER-DEFINED NOT NULL,
  initiated_by uuid NOT NULL,
  relationship_id integer NOT NULL DEFAULT nextval('user_relationships_relationship_id_seq'::regclass),
  status USER-DEFINED DEFAULT 'PENDING'::relationship_status,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_relationships_pkey PRIMARY KEY (relationship_id),
  CONSTRAINT user_relationships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT user_relationships_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(user_id),
  CONSTRAINT user_relationships_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.relationship_invites (
  inviter_id uuid NOT NULL,
  relationship_type USER-DEFINED NOT NULL,
  invitee_id uuid NOT NULL,
  accepted_at timestamp with time zone,
  invite_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status character varying NOT NULL DEFAULT 'PENDING'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT relationship_invites_pkey PRIMARY KEY (invite_id),
  CONSTRAINT relationship_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(user_id),
  CONSTRAINT relationship_invites_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.single_player_levels (
  level_number integer NOT NULL,
  prompt_id uuid NOT NULL,
  CONSTRAINT single_player_levels_pkey PRIMARY KEY (level_number),
  CONSTRAINT single_player_levels_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(prompt_id)
);
CREATE TABLE public.single_player_progress (
  user_id uuid NOT NULL,
  current_level integer NOT NULL DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT single_player_progress_pkey PRIMARY KEY (user_id),
  CONSTRAINT single_player_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT single_player_progress_current_level_fkey FOREIGN KEY (current_level) REFERENCES public.single_player_levels(level_number)
);
CREATE TABLE public.curated_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category character varying,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT curated_packs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_puzzles (
  puzzle_date date NOT NULL,
  message text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_puzzles_pkey PRIMARY KEY (puzzle_date)
);
CREATE TABLE public.daily_puzzle_attempts (
  user_id uuid NOT NULL,
  puzzle_date date NOT NULL,
  best_time_seconds integer,
  attempts_used integer DEFAULT 0,
  solved boolean DEFAULT false,
  started_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_puzzle_attempts_pkey PRIMARY KEY (user_id, puzzle_date),
  CONSTRAINT daily_puzzle_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT daily_puzzle_attempts_puzzle_date_fkey FOREIGN KEY (puzzle_date) REFERENCES public.daily_puzzles(puzzle_date)
);
CREATE TABLE public.user_pair_scores (
  user_one uuid NOT NULL,
  user_two uuid NOT NULL,
  last_activity_at timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  current_score integer NOT NULL DEFAULT 0,
  highest_score integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_pair_scores_pkey PRIMARY KEY (id),
  CONSTRAINT user_pair_scores_user_two_fkey FOREIGN KEY (user_two) REFERENCES auth.users(id),
  CONSTRAINT user_pair_scores_user_two_fkey1 FOREIGN KEY (user_two) REFERENCES public.users(user_id),
  CONSTRAINT user_pair_scores_user_one_fkey FOREIGN KEY (user_one) REFERENCES public.users(user_id)
);
