//DailyPuzzle.jsx
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import GameEngine from '../components/GameEngine'
import Loading from '../components/Loading'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { generateCryptogramMap, pickRandomIndices, initializeGuesses, findFirstUnrevealed } from '../helper/helper.js'

export default function DailyPuzzle() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [session, setSession] = useState(null)
    const [dailyStatus, setDailyStatus] = useState(null)
    const [hasStarted, setHasStarted] = useState(false)
    const [countdown, setCountdown] = useState(null)

    useEffect(() => {
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

                let attempt = null

                if (user) {
                    const { data } = await supabase
                        .from("daily_puzzle_attempts")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("puzzle_date", today)
                        .single()

                    attempt = data
                    setDailyStatus(attempt)
                }

                if (attempt?.solved || attempt?.attempts_used >= 3) {
                    setSession(null)
                    setHasStarted(true)
                    return
                }

                const cryptogramMap = generateCryptogramMap(promptText)
                const chars = promptText.split("")
                const revealedIndices = pickRandomIndices(chars, 3)
                const guesses = initializeGuesses(cryptogramMap, revealedIndices, promptText)
                const activeIndex = findFirstUnrevealed(chars, revealedIndices)

                const dailySession = {
                    session_id: "daily-" + today,
                    cryptogram_map: cryptogramMap,
                    revealed_indices: revealedIndices,
                    initial_revealed: revealedIndices,
                    guesses: guesses,
                    active_index: activeIndex,
                    lives: 3,
                    hints_used: 0
                }

                setSession(dailySession)
            } catch (error) {
                console.error("Error loading daily puzzle:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDailyPuzzle()
    }, [user])

    useEffect(() => {
        if (countdown === null) return

        if (countdown === 0) {
            setHasStarted(true)
            setCountdown(null)
            return
        }

        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1)
        }, 1000)

        return () => clearTimeout(timer)
    }, [countdown])

    if (loading) return <Loading />

    const isBlocked = dailyStatus?.solved || dailyStatus?.attempts_used >= 3
    const showStartOverlay = !isBlocked && !hasStarted

    const handleStart = () => {
        setCountdown(3)
    }

    return (
        <>
            <Navbar />

            {showStartOverlay && (
                <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
                    <div className="bg-white shadow-lg w-full max-w-xl p-6 sm:p-8 text-center space-y-4">
                        <h1 className="text-2xl font-bold">Daily Puzzle</h1>
                        <p className="text-gray-700">
                            You get 3 total attempts each day.
                            If you run out of lives, that round uses one attempt.
                        </p>
                        <p className="text-gray-700">
                            Complete today&apos;s puzzle before all 3 attempts are used.
                            Once you complete the puzzle, you cannot play again until the next day&apos;s puzzle is released.
                        </p>

                        {countdown === null ? (
                            <button className="btn btn-primary" onClick={handleStart}>
                                Start
                            </button>
                        ) : (
                            <div className="text-4xl font-bold text-indigo-600">{countdown}</div>
                        )}
                    </div>
                </div>
            )}

            {(hasStarted || isBlocked) && (
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
