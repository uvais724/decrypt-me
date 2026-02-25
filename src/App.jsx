// App.jsx

import GameList from "./pages/GameList";
import Game from "./pages/Game";
import NewGame from "./pages/NewGame";
import DemoGame from "./pages/DemoGame";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GameRefreshProvider } from './context/GameRefreshContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from "./pages/Login";
import SendInvite from "./pages/SendInvite";
import Invite from "./pages/Invite";
import CuratedPacks from "./pages/CuratedPacks";
import AuthCallback from "./pages/AuthCallback";
import DailyPuzzle from "./pages/DailyPuzzle";
import Archive from "./pages/Archive";

export default function App() {

  return (
    <Router>
      <AuthProvider>
        <GameRefreshProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/demo-game" element={<DemoGame />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<GameList />} />
              <Route path="/daily" element={<DailyPuzzle />} />
              <Route path="/:gameId" element={<Game />} />
              <Route path="/new-game" element={<NewGame />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/invite" element={<Invite />} />
              <Route path="/send-invite" element={<SendInvite />} />
              <Route path="/curated-packs" element={<CuratedPacks />} />
            </Route>
          </Routes>
        </GameRefreshProvider>
      </AuthProvider>
    </Router>
  );
};
