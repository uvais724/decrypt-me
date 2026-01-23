import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import { supabase } from '../lib/supabaseClient';
import { setDifficultyLevel, generateCryptogramMap, pickRandomIndices, initializeGuesses, findFirstUnrevealed } from '../helper/helper.js'

export default function NewGame() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [relatedUsers, setRelatedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(location.state?.message || '');
    const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg(null);
        setLoading(true);
        const promptText = e.target.Message.value.toUpperCase().trim();
        const alphabetsMatch = promptText.match(/[A-Z]/g) || [];
        if (alphabetsMatch.length < 10) {
            setErrorMsg('Prompt must be at least 10 alphabetic characters long.');
            setLoading(false);
            return;
        }

        try {
            const difficulty = setDifficultyLevel(promptText);
            const cryptogramMap = generateCryptogramMap(promptText);
            let revealedCharCount = difficulty === 'medium' ? 5 : difficulty === 'hard' ? 8 : 3;

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

            if(data) console.log('New game created with ID:', data);

            setLoading(false);
            navigate('/');
        } catch (error) {
            console.error(error);
            setErrorMsg('Failed to create a new game. Please try again later.');
            setLoading(false);
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
                                disabled={loading}
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

                            <div className="card-actions justify-end mt-4">
                                <button type="submit" className="btn btn-primary">Create</button>
                                <button type="button" className="btn" onClick={() => navigate('/')}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
