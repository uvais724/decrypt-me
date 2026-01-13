import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import { supabase } from '../lib/supabaseClient';

export default function NewGame() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [relatedUsers, setRelatedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(true);

    function generateCryptogramMap(text) {
        const letters = [...new Set(text.toUpperCase().match(/[A-Z]/g))];
        const numbers = Array.from({ length: 26 }, (_, i) => i + 1);

        shuffle(numbers);

        const map = {};
        letters.forEach((letter, i) => {
            map[letter] = numbers[i];
        });

        return map;
    }

    function cryptoRandomInt(min, max) {
        const range = max - min;
        if (range <= 0) {
            throw new Error('Max must be greater than min.');
        }

        // Use Uint32Array for a range up to 2^32
        const byteArray = new Uint32Array(1);
        window.crypto.getRandomValues(byteArray);

        // Get a value between 0 (inclusive) and range (exclusive)
        const randomValue = byteArray[0] % range;

        return min + randomValue;
    }

    function shuffle(array) {
        // Fisher–Yates shuffle using crypto for better randomness
        for (let i = array.length - 1; i > 0; i--) {
            const j = cryptoRandomInt(0, i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function pickRandomIndices(chars, count) {
        console.log('Characters" ', chars);
        const result = chars
            .map((c, i) => (/[A-Z]/.test(c) ? i : null))
            .filter(i => i !== null)
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
        console.log('Result: ', result);
        return result;
    }


    function findFirstUnrevealed(chars, revealed) {
        return chars.findIndex(
            (c, i) => /[A-Z]/.test(c) && !revealed.includes(i)
        );
    }

    function initializeGuesses(cryptogramMap, revealedIndices, message) {
        console.log('Cryptogram map: ', cryptogramMap);
        console.log('Initial reveaded indices: ', revealedIndices);
        console.log('Message: ', message);
        const guesses = {};
        // For revealed indices, map the character to its cryptogram number
        revealedIndices.forEach(index => {
            const char = message.charAt(index).toUpperCase();
            if (cryptogramMap[char]) {
                guesses[cryptogramMap[char]] = char;
            }
        });

        return guesses;
    }

    function setDifficultyLevel(promptText) {
        //calculate word count by only counting letters A-Z
        const wordCount = promptText.match(/[a-zA-Z]/g)?.length || 0;
        if (wordCount < 50) return 'easy';
        if (wordCount <= 100) return 'medium';
        return 'hard';
    }

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
                    .eq('status', 'accepted');

                if (data) {
                    // Map through the results and return the user that is NOT the current user
                    const relatedUsers = data.map(rel => {
                        return rel.user.user_id === user.Id ? rel.related_user : rel.user;
                    });
                    setRelatedUsers(relatedUsers);
                    setLoading(false);
                }

                if (error) throw error;

            } catch (error) {
                console.error('Error fetching related users:', error);
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchRelatedUsers();
        }
    }, [user?.id]);

    const onsubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const promptText = e.target.Message.value.toUpperCase();
        const userId = user.id;
        const recipientId = selectedUser;

        try {
            const { count } = await supabase
                .from('games')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'IN_PROGRESS');

            if (count > 5) {
                throw error('Max games reached');
            }

            const { data: prompt, error: promptError } = await supabase
                .from('prompts')
                .insert({
                    sender_id: userId,
                    receiver_id: recipientId,
                    prompt_text: promptText,
                    type: 'custom'
                })
                .select()
                .single();

            if (promptError) throw promptError

            const difficulty = setDifficultyLevel(promptText);

            const { data: game, error: gameError } = await supabase
                .from('games')
                .insert({
                    prompt_id: prompt.prompt_id,
                    difficulty_level: difficulty
                })
                .select()
                .single();

            if (gameError) {
                await supabase.from('prompts').delete().eq('prompt_id', prompt.prompt_id);
                throw gameError;
            }

            //Created game session  
            const gameId = await game.game_id;
            const message = promptText.toUpperCase();
            const cryptogramMap = generateCryptogramMap(promptText);
            let revealedCharCount = 3;
            if (difficulty === 'medium') {
                revealedCharCount = 5;
            } else if (difficulty === 'hard') {
                revealedCharCount = 8;
            }

            const chars = message.split("");
            const revealedIndices = pickRandomIndices(chars, revealedCharCount);
            const initialRevealedIndices = revealedIndices;
            const guesses = initializeGuesses(cryptogramMap, revealedIndices, message);
            const activeIndex = findFirstUnrevealed(chars, revealedIndices);


            const { error } = await supabase
                .from('game_sessions')
                .insert({
                    game_id: gameId,
                    user_id: recipientId,
                    message,
                    cryptogram_map: cryptogramMap,
                    guesses,
                    revealed_indices: revealedIndices,
                    initial_revealed: initialRevealedIndices,
                    active_index: activeIndex,
                });

            if (error) {
                await supabase.from('prompts').delete().eq('prompt_id', prompt.prompt_id);
                await supabase.from('games').delete().eq('game_id', gameId);
                throw error;
            }

            setLoading(false);
            navigate('/');
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    }

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
