// App.jsx

import GameList from "./pages/GameList";
import Game from "./pages/Game";
import NewGame from "./pages/NewGame";
import { BrowserRouter,  Routes, Route } from 'react-router-dom';

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* The 'element' prop specifies the component to render when the path matches */}
        <Route path="/" element={<GameList />} />
        <Route path="/:gameId" element={<Game />} />
        <Route path="/new-game" element={<NewGame />} />
        {/* A catch-all route for 404 pages (optional, placed last) */}
        <Route path="*" element={<h2>404 Not Found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}
