import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Loading from '../components/Loading';
import ScoreIncrement from '../components/ScoreIncrement';
import { repositories } from '../repositories/SupabaseRepositories';
import { gameCreationService } from '../services/GameServices';

export default function NewGame() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [relatedUsers, setRelatedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(location.state?.message || '');
    const [errorMsg, setErrorMsg] = useState('');
    const [scoreIncrementData, setScoreIncrementData] = useState(null);

    useEffect(() => {
        const fetchRelatedUsers = async () => {
            try {
                const relatedUsers = await repositories.relationships.findAcceptedForUser(user.id);
                setRelatedUsers(relatedUsers);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching related users:', error);
                setErrorMsg('Failed to load related users. Please try again later.');
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchRelatedUsers();
        }
    }, [user?.id]);

    const onsubmit = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            setErrorMsg('Please select a user to send the game to.');
            return;
        }

        setErrorMsg(null);
        setSubmitting(true);
        const promptText = e.target.Message.value.toUpperCase().trim();
        const alphabetsMatch = promptText.match(/[A-Z]/g) || [];
        if (alphabetsMatch.length < 10) {
            setErrorMsg('Prompt must be at least 10 alphabetic characters long.');
            setSubmitting(false);
            return;
        }

        try {
            const { gameId, scoreData } = await gameCreationService.createFriendGame({
                senderId: user.id,
                receiverId: selectedUser,
                promptText
            });

            if (gameId) console.log('New game created with ID:', gameId);
            setScoreIncrementData(scoreData);
            setSubmitting(false);
            if (!scoreData) {
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || 'Failed to create a new game. Please try again later.');
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
                <div className="card w-full max-w-lg shadow-xl bg-base-100">
                    <div className="card-body">
                        <h2 className="card-title">Start New Game</h2>
                        <p className="text-sm text-neutral">Enter a prompt to generate the game challenge.</p>
                        <p className="text-sm text-neutral">No Friends ? Click on below invite button</p>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/send-invite')}>Invite</button>
                        <form onSubmit={onsubmit} className="form-control mt-4">
                            {errorMsg && (
                                <div className="alert alert-error shadow-lg">
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <label htmlFor="User" className="label">
                                <span className="label-text">Send to</span>
                            </label>

                            <select
                                id="User"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="select select-bordered w-full"
                                disabled={loading || submitting}
                            >
                                <option value="">
                                    {loading ? 'Loading users...' : 'Select a user'}
                                </option>
                                {relatedUsers.map((relatedUser) => (
                                    <option key={relatedUser.user_id} value={relatedUser.user_id}>
                                        {relatedUser.username}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="Message" className="label mt-4">
                                <span className="label-text">Prompt</span>
                            </label>

                            <textarea
                                name="Message"
                                id="Message"
                                type="text"
                                placeholder="Type your prompt..."
                                className="textarea w-full h-[30vh]"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />

                            <div className="label flex justify-end mt-1">
                                <span className="label-text-alt text-gray-500">{message.length} characters</span>
                            </div>

                            <div className="card-actions justify-end mt-4">
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create'}
                                </button>
                                <button type="button" className="btn" onClick={() => navigate('/')} disabled={submitting}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {scoreIncrementData && (
                <div className="modal modal-open">
                    <div className="modal-box text-center">
                        <h3 className="font-bold text-lg">Game Created</h3>
                        <p className="mt-1 text-base-content/70">Pair score updated successfully.</p>
                        <ScoreIncrement
                            previousScore={scoreIncrementData.previousScore}
                            currentScore={scoreIncrementData.currentScore}
                            incrementBy={scoreIncrementData.incrementBy}
                            label="Pair Score"
                        />
                        <div className="modal-action justify-center">
                            <button className="btn btn-primary" onClick={() => navigate('/')}>
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
