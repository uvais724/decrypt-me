// App.jsx

import GameList from "./pages/GameList";
import Game from "./pages/Game";
import NewGame from "./pages/NewGame";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './router/ProtectedRoute';
import Login from "./pages/Login";

export default function App() {

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<GameList />} />
            <Route path="/:gameId" element={<Game />} />
            <Route path="/new-game" element={<NewGame />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};
