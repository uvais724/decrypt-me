import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Modal({ gameId, sessionId, gamePuzzle, gameResult, onTryAgain }) {
    const dialogRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        dialogRef.current?.showModal();
        if (gamePuzzle) {
            const updateGameStatus = async () => {
                try {
                    // const response = await apiClient.put(`/games/${gameId}`, {
                    //     status: 'SOLVED'
                    // });
                    // const data = await response.data;
                    // console.log('Game status updated:', data);
                    const { error } = await supabase
                        .from('games')
                        .update({
                            status: 'SOLVED',
                            solved_at: new Date().toISOString()
                        })
                        .eq('game_id', gameId);

                    if (error) throw error;

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
                //await apiClient.delete(`/game/session/${sessionId}`);
                const { error } = await supabase
                    .from('game_sessions')
                    .delete()
                    .eq('session_id', sessionId);

                if (error) throw error;
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
