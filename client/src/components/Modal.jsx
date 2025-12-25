import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';

export default function Modal({ gameId, gamePuzzle, gameResult, onTryAgain }) {
    const dialogRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        dialogRef.current?.showModal();
        if(gamePuzzle) {
            const updateGameStatus = async () => {
                try {
                    const response = await fetch(`/api/games/${gameId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'solved' })
                    });
                    const data = await response.json();
                    console.log('Game status updated:', data);
                } catch (error) {
                    console.error('Error updating game status:', error);
                }
            };
            updateGameStatus();
        }
    }, []);

    const handleClose = () => {
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
