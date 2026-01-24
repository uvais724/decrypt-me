import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useGameRefresh } from '../context/GameRefreshContext';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import SinglePlayer from '../components/SinglePlayer';

const styles = `
  @keyframes fadeOut {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
  
  .notification-fade-out {
    animation: fadeOut 0.5s ease-in-out forwards;
  }
`;

export default function GameList() {
    const [gamesList, setGamesList] = useState([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const { refreshTrigger } = useGameRefresh();
    const [pendingInvites, setPendingInvites] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

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
        
        // Set loading to true when refresh is triggered
        setLoading(true);
        
        const fetchAllGamesInProgress = async () => {
            try {
                const { data, error } = await supabase
                .from('games')
                .select(`
                    game_id,
                    difficulty_level,
                    status,
                    prompts!inner (
                        prompt_text,
                        sender_id,
                        users!prompts_sender_id_fkey(username)
                    ),
                    game_sessions (
                        revealed_indices,
                        lives,
                        hints_used
                    )
                `)
                .eq('prompts.receiver_id', user.id)
                .eq('status', 'IN_PROGRESS');

                if(error) throw error;
                    
                if(data) {
                    const gamesData =  data.map(g => ({
                        game_id: g.game_id,
                        difficulty_level: g.difficulty_level,
                        prompt_text: g.prompts.prompt_text,
                        sender: g.prompts.users.username,
                        lives_left: g.game_sessions?.[0]?.lives ?? g.lives_left,
                        hints_used: g.game_sessions?.[0]?.hints_used ?? g.hints_used,
                        revealed_indices: g.game_sessions?.[0]?.revealed_indices ?? []
                    }));
                    console.log(gamesData);
                    setGamesList(gamesData);
                }
            } catch (error) {
                console.error("Error fetching all games:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchPendingInvites = async () => {
            try {
                const { data, error } = await supabase
                .from('relationship_invites')
                 .select('*', { count: 'exact' })
                .eq('invitee_id', user.id)
                .eq('status', 'PENDING');

                if (error) throw error;
                const inviteCount = data.length;
                setPendingInvites(inviteCount);
                
                // Show notification if there are pending invites
                if (inviteCount > 0) {
                    setShowNotification(true);
                    setFadeOut(false);
                }
            } catch (error) {
                console.error("Error fetching pending invites:", error);
            }
        };

        fetchAllGamesInProgress();
        fetchPendingInvites();
    }, [user, refreshTrigger])

    // Auto-hide notification after 5 seconds
    useEffect(() => {
        if (showNotification && !fadeOut) {
            const timer = setTimeout(() => {
                setFadeOut(true);
                setTimeout(() => {
                    setShowNotification(false);
                }, 500); // Wait for fade animation to complete
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showNotification, fadeOut]);

    if (loading) return <Loading />;

    return (
        <>
            <style>{styles}</style>
            <Navbar />
            {showNotification && (
                <div className={`fixed top-0 left-0 right-0 z-50 ${fadeOut ? 'notification-fade-out' : ''}`}>
                    <div className="bg-info text-info-content px-6 py-4 shadow-lg">
                        <div className="container mx-auto flex items-center justify-between">
                            <span className="font-semibold">You have {pendingInvites} pending {pendingInvites === 1 ? 'invite' : 'invites'}!</span>
                            <Link to="/invite" className="underline font-semibold hover:opacity-80">
                                View Invites
                            </Link>
                        </div>
                    </div>
                </div>
            )}
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
                                            <h2 className="card-title">From: {game.sender}</h2>
                                            {/* <p className="text-sm text-muted">From: <span className="font-medium">{game.sender}</span></p> */}
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
                                            <button className="btn btn-primary btn-sm" disabled={loading}>Play</button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <SinglePlayer />
        </>
    )
}