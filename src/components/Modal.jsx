import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useGameRefresh } from '../context/GameRefreshContext';
import { toPng } from "html-to-image";
import { isDesktop } from '../helper/helper';

export default function Modal({ gameId, sessionId, gamePuzzle, gameResult, onTryAgain, isSinglePlayer = false, currentLevel = null, isDemo = false }) {
    const dialogRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { triggerRefresh } = useGameRefresh();

    useEffect(() => {
        dialogRef.current?.showModal();

        // Prevent closing when clicking outside the modal
        const handleCancel = (e) => {
            e.preventDefault();
        };

        dialogRef.current?.addEventListener('cancel', handleCancel);

        if (gamePuzzle) {
            const updateGameStatus = async () => {
                try {
                    if (!isSinglePlayer) {
                        const { error } = await supabase
                            .from('games')
                            .update({
                                status: 'SOLVED',
                                solved_at: new Date().toISOString()
                            })
                            .eq('game_id', gameId);

                        if (error) throw error;
                    }


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

        return () => {
            dialogRef.current?.removeEventListener('cancel', handleCancel);
        };
    }, []);

    const handleClose = async () => {
        // In demo mode, just navigate back to login
        if (isDemo) {
            navigate('/login');
            return;
        }

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

        const deleteGame = async () => {
            try {
                const { error } = await supabase
                    .from('games')
                    .delete()
                    .eq('game_id', gameId);
                if (error) throw error;
            } catch (error) {
                console.error("Error deleting game:", error);
            }
        };

        await deleteSession();
        if (isSinglePlayer) {
            await deleteGame();
        }

        dialogRef.current?.close();
    };


    const handleShare = async () => {
        if (!dialogRef.current) return;

        const dataUrl = await toPng(dialogRef.current, {
            backgroundColor: "#ffffff",
            pixelRatio: 2
        });

        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "cryptogram-win.png", {
            type: "image/png"
        });

        // ✅ Mobile share
        if (!isDesktop() && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
                title: "I cracked this cryptogram 🧠🔥",
                files: [file]
            });
        } else {
            // ⬇️ Desktop fallback
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = "cryptogram-win.png";
            link.click();
        }

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
                </blockquote>
                </> : <span></span>}

                <div className="mt-4">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        {gameResult === "Game Over!" ? <button className="btn" onClick={onTryAgain}>Try Again</button> : <div className="flex justify-between"><button
                        className="btn btn-success"
                        onClick={handleShare}
                    >
                        Share 🎉
                    </button><button className="btn" onClick={handleClose}>Close</button></div>}
                    </form>
                </div>
            </div>
        </dialog>
    )
}
