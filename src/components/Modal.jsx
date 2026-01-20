import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useGameRefresh } from '../context/GameRefreshContext';

export default function Modal({ gameId, sessionId, gamePuzzle, gameResult, onTryAgain, isSinglePlayer = false, currentLevel = null }) {
    const dialogRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { triggerRefresh } = useGameRefresh();

    useEffect(() => {
        dialogRef.current?.showModal();
        if (gamePuzzle) {
            const updateGameStatus = async () => {
                try {
                    const { error } = await supabase
                        .from('games')
                        .update({
                            status: 'SOLVED',
                            solved_at: new Date().toISOString()
                        })
                        .eq('game_id', gameId);

                    if (error) throw error;

                    // If single player, increment the level
                    if (isSinglePlayer && currentLevel !== null) {
                        const { error: updateError } = await supabase
                            .from('single_player_progress')
                            .update({
                                current_level: currentLevel + 1
                            })
                            .eq('user_id', user.id);

                        if (updateError) throw updateError;
                    }

                } catch (error) {
                    console.error('Error updating game status:', error);
                }
            };
            updateGameStatus();
        }
    }, []);

    const handleClose = async () => {
        const deleteSession = async () => {
            try {
                const { error } = await supabase
                    .from('game_sessions')
                    .delete()
                    .eq('session_id', sessionId);

                if (error) throw error;
                
                // Trigger refresh to update GameList
                triggerRefresh();
                setLoading(false);
            } catch (error) {
                console.error("Error deleting session:", error);
                setLoading(false);
            }
        };
        await deleteSession();
        dialogRef.current?.close();
        navigate('/');
    };


    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box">
                <h3 className={`font-bold text-lg ${gameResult === "Game Over!" ? "text-red-500" : "text-green-500"}`}>{gameResult}</h3>
                {isSinglePlayer && gameResult !== "Game Over!" && (
                    <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded">
                        <p className="text-purple-800 font-semibold">Level {currentLevel} Complete!</p>
                        <p className="text-sm text-purple-700 mt-1">Next level unlocked. Return to continue!</p>
                    </div>
                )}
                {gamePuzzle ? <><h3>The hidden message is</h3> <blockquote className="p-4 mt-2 text-xl italic font-semibold tracking-tight text-heading bg-gray-300">
                    <p>{gamePuzzle}</p>
                </blockquote></> : <span></span>}

                <div className="modal-action">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        {gameResult === "Game Over!" ? <button className="btn" onClick={onTryAgain}>Try Again</button> : <button className="btn" onClick={handleClose}>Close</button>}
                    </form>
                </div>
            </div>
        </dialog>
    )
}
