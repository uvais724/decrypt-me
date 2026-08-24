# Frontend Components

## Layout And Navigation

- `Navbar`: shared navigation and logout access for authenticated areas.
- `AppLayout`: wraps protected pages with the navbar.
- `Loading`: shared loading spinner/state component.

## Gameplay Components

- `GameEngine`: main gameplay container. It wires `useCryptogramGame` to board UI, keyboard UI, lives, hints, persistence, give-up flow, daily attempt tracking, and completion modal.
- `Board`: renders the cryptogram grid/cells.
- `Cell`: renders an individual board cell.
- `Keyboard`: renders the on-screen alphabet keyboard with disabled and partially revealed states.
- `Lives`: displays remaining lives.
- `Modal`: completion/game-over modal. It updates backend state, handles share image generation, closes games, and routes home.
- `ConfirmationModal`: confirms give-up actions.
- `ScoreIncrement`: displays pair-score movement after creating or solving a friend game.
- `Share`: hidden render target used by `html-to-image` to generate a shareable PNG.

## Product Components

- `SinglePlayer`: dashboard panel for the current single-player level. It creates or resumes a game for the current level.
- `Leaderboard`: daily puzzle leaderboard shown from the login page.
- `HowToPlay`: modal with gameplay instructions.

## Styling

The app uses:

- Tailwind CSS 4 through the Vite Tailwind plugin.
- DaisyUI light theme.
- Component-specific CSS in `src/components/GameEngine.css`.
- AG Grid styles/classes for the archive table.

## Component-State Boundaries

- `GameEngine` owns mode-specific behavior and delegates puzzle mechanics to `useCryptogramGame`.
- `useCryptogramGame` owns the mutable puzzle state.
- `Modal` owns completion side effects.
- Page components own route-level loading and Supabase fetches.
