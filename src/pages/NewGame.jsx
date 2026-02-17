import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import ScoreIncrement from '../components/ScoreIncrement';
import { supabase } from '../lib/supabaseClient';
import { incrementPairScoreWithPrevious } from '../lib/pairScore';
import { setDifficultyLevel, generateCryptogramMap, pickRandomIndices, initializeGuesses, findFirstUnrevealed } from '../helper/helper.js'

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
                const userId = user.id;
                const { data, error } = await supabase
                    .from('user_relationships')
                    .select(`
                status,
                user:users!user_relationships_user_id_fkey (user_id, username),
                related_user:users!user_relationships_related_user_id_fkey (user_id, username)
                `)
                    // Use .or to check both columns for the current user's ID
                    .or(`user_id.eq.${userId},related_user_id.eq.${userId}`)
                    .eq('status', 'ACCEPTED');

                if (data) {
                    // Map through the results and return the user that is NOT the current user
                    const relatedUsers = data.map(rel => {
                        return rel.user.user_id === userId ? rel.related_user : rel.user;
                    });
                    setRelatedUsers(relatedUsers);
                    setLoading(false);
                }

                if (error) throw error;

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

        //check if there are already 5 messages sent to the selected user which is yet to be solved or given up if yes then don't allow the user to create a new game with that user and show an error message
        // the sender_id is part of the prompts table and not the games table so we need to check the prompts table for the sender_id, receiver and receiver_id joined by the prompt_id in the games table and check the status of the game in the games table if it is in progress then we need to count it if the count is more than 5 then we need to show an error message and don't allow the user to create a new game with that user
        try {
            const { data, error } = await supabase
                .from('games')
                .select('*, prompts!inner(*)')
                .eq('prompts.sender_id', user.id)
                .eq('prompts.receiver_id', selectedUser)
                .eq('status', 'IN_PROGRESS');

            if (error) throw error;

            if (data && data.length >= 5) {
                setErrorMsg('Cannot send more than 5 games to this user. Please wait for them to be solved before sending more.');
                return;
            }
        } catch (error) {
            console.error('Error checking existing games:', error);
            setErrorMsg('Failed to check existing games. Please try again later.');
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
            const difficulty = setDifficultyLevel(promptText);
            const cryptogramMap = generateCryptogramMap(promptText);
            let revealedCharCount = difficulty === 'medium' ? 5 : difficulty === 'hard' ? 8 : 3;
            let didUpdateScore = false;

            const chars = promptText.split("");
            const revealedIndices = pickRandomIndices(chars, revealedCharCount);
            const guesses = initializeGuesses(cryptogramMap, revealedIndices, promptText);
            const activeIndex = findFirstUnrevealed(chars, revealedIndices);

            // Single RPC call - atomic transaction
            const { data, error } = await supabase.rpc('create_new_game', {
                p_sender_id: user.id,
                p_receiver_id: selectedUser,
                p_prompt_text: promptText,
                p_difficulty_level: difficulty,
                p_cryptogram_map: cryptogramMap,
                p_revealed_indices: revealedIndices,
                p_initial_revealed: revealedIndices,
                p_guesses: guesses,
                p_active_index: activeIndex
            });

            if (error) throw error;

            if (data) console.log('New game created with ID:', data);

            try {
                const scoreData = await incrementPairScoreWithPrevious(user.id, selectedUser, 1);
                setScoreIncrementData(scoreData);
                didUpdateScore = true;
            } catch (scoreError) {
                console.error("Error incrementing pair score:", scoreError);
            }

            setSubmitting(false);
            if (!didUpdateScore) {
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('Failed to create a new game. Please try again later.');
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <>
            <Navbar />
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
