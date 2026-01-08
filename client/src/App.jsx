// App.jsx

import GameList from "./pages/GameList";
import Game from "./pages/Game";
import NewGame from "./pages/NewGame";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from "./pages/Login";
import SendInvite from "./pages/SendInvite";
import AcceptInvite from "./pages/AcceptInvite";
import AcceptInviteConfirm from "./pages/AcceptInviteConfirm";

export default function App() {

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/invite/accept" element={<AcceptInvite />} />
          <Route path="/accept-invite/confirm" element={<AcceptInviteConfirm />} />
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<GameList />} />
            <Route path="/:gameId" element={<Game />} />
            <Route path="/new-game" element={<NewGame />} />
            <Route path="/send-invite" element={<SendInvite />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};
