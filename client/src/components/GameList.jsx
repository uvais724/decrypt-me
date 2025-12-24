import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';

export default function GameList() {
    const [gamesList = [], setGamesList] = useState([]);
    useEffect(() => {
        const fetchAllGamesInProgress = async () => {
            try {
                const response = await fetch('/api/games');
                const gamesData = await response.json();
                console.log(gamesData);
                setGamesList(gamesData);
            } catch (error) {
                console.error("Error fetching all games:", error);
            }
        };
        fetchAllGamesInProgress();
    }, [])

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Games In Progress</h1>

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {gamesList.map((game) => (
                    <div key={game.game_id} className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title">Game #{game.game_id}</h2>
                            <div className="card-actions justify-end">
                                <button className="btn btn-sm btn-primary"><Link to={`/${game.game_id}`} state={{gameId: game.game_id}}>Play</Link></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
