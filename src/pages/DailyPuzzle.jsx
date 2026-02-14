//DailyPuzzle.jsx
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import GameEngine from '../components/GameEngine'
import Loading from '../components/Loading'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { generateCryptogramMap, pickRandomIndices, initializeGuesses, findFirstUnrevealed } from '../helper/helper.js'
import { Link } from 'react-router-dom'

export default function DailyPuzzle() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [session, setSession] = useState(null);
    const [dailyStatus, setDailyStatus] = useState(null)

    useEffect(() => {

        if (dailyStatus?.solved || dailyStatus?.attempts_used >= 3) {
            setSession(null);
            setLoading(false);
            return;
        }

        const fetchDailyPuzzle = async () => {
            try {
                const today = new Date().toISOString().split("T")[0]

                const { data: puzzle, error } = await supabase
                    .from("daily_puzzles")
                    .select("*")
                    .eq("puzzle_date", today)
                    .single()

                if (error) throw error

                const promptText = puzzle.message.toUpperCase()

                setMessage(promptText)

                if (user) {
                    const { data: attempt } = await supabase
                        .from("daily_puzzle_attempts")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("puzzle_date", today)
                        .single()

                    setDailyStatus(attempt)
                }

                // ---- Initialize session using LOCAL variable ----

                const cryptogramMap = generateCryptogramMap(promptText);

                const chars = promptText.split("");

                const revealedIndices = pickRandomIndices(chars, 3);

                const guesses = initializeGuesses(cryptogramMap, revealedIndices, promptText);

                const activeIndex = findFirstUnrevealed(chars, revealedIndices);

                const dailySession = {
                    session_id: "daily-" + today,
                    cryptogram_map: cryptogramMap,
                    revealed_indices: revealedIndices,
                    initial_revealed: revealedIndices,
                    guesses: guesses,
                    active_index: activeIndex,
                    lives: 3,
                    hints_used: 0
                };

                setSession(dailySession);

            } catch (error) {
                console.error("Error loading daily puzzle:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDailyPuzzle();

    }, []);


    if (loading) return <Loading />

    return (
        <>
            <Navbar />
            {dailyStatus?.solved ? (
                <div className="text-center p-10">
                    <h2 className="text-xl font-bold text-green-600">
                        ✅ You already solved today's puzzle!
                    </h2>
                    <p>Come back tomorrow for a new challenge.</p>
                    <Link to="/" className="btn btn-primary mt-4">
                        Back to Home
                    </Link>
                </div>
            ) : dailyStatus?.attempts_used >= 3 ? (
                <div className="text-center p-10">
                    <h2 className="text-xl font-bold text-red-600">
                        ❌ No attempts left for today.
                    </h2>
                    <p>Try again tomorrow.</p>
                </div>
            ) : (
                <GameEngine
                    gameId="daily"
                    message={message}
                    isDailyPuzzle={true}
                    dailyStatus={dailyStatus}
                    session={session}
                />
            )}

        </>
    )
}
