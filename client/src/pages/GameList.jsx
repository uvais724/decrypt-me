import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function GameList() {
    const [gamesList, setGamesList] = useState([]);
    const { user } = useAuth();

    const difficultyBadge = (level) => {
        if (!level) return 'badge badge-neutral';
        const map = {
            easy: 'badge-success',
            medium: 'badge-warning',
            hard: 'badge-error'
        };
        return `badge ${map[level.toLowerCase()] || 'badge-outline'}`;
    };

    useEffect(() => {
        if (!user) return;
        const fetchAllGamesInProgress = async () => {
            try {
                const response = await apiClient.get(`/games/list/${user.id}`);
                const gamesData = response.data;
                console.log(gamesData);
                setGamesList(gamesData);
            } catch (error) {
                console.error("Error fetching all games:", error);
            }
        };
        fetchAllGamesInProgress();
    }, [user])

    return (
        <>
            <Navbar />

            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-extrabold">Games In Progress</h1>
                    <Link className="btn btn-primary btn-sm" to="/new-game">
                        <button>
                            Start New Game
                        </button>
                    </Link>
                </div>

                {(!gamesList || gamesList.length === 0) ? (
                    <div className="py-16">
                        <p className="text-center italic text-neutral">No active games — start a new one!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {gamesList.map((game) => (
                            <div key={game.game_id} className="card card-compact bg-base-200 shadow hover:shadow-xl transition">
                                <div className="card-body">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="card-title">Game #{game.game_id}</h2>
                                            <p className="text-sm text-muted">From: <span className="font-medium">{game.username}</span></p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={difficultyBadge(game.difficulty_level)}>{game.difficulty_level ?? 'Unknown'}</span>
                                            {/* <span className="text-xs text-neutral mt-2">Hints: <span className="font-semibold">{game.hints_used}</span></span> */}
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-neutral mb-1">Lives</div>
                                                <div className="text-2xl font-bold text-error">{game.lives_left}<span className="text-lg text-neutral">/3</span></div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-neutral uppercase tracking-wide">Hints Used</div>
                                                <div className="text-2xl font-bold">{game.hints_used}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {game.revealed_indices && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-neutral mb-1">Revealed Letters</div>
                                                <div className="text-sm font-bold">{game.revealed_indices.length} / {game.prompt_text.replace(/[^a-zA-Z]/g, '').length}</div>
                                            </div>
                                            <progress className="progress progress-info w-full" value={game.revealed_indices.length} max={game.prompt_text.replace(/[^a-zA-Z]/g, '').length}></progress>
                                        </div>
                                    )}

                                    <div className="card-actions justify-end mt-2">
                                        <Link to={`/${game.game_id}`} state={{ gameId: game.game_id }}>
                                            <button className="btn btn-primary btn-sm">Play</button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}