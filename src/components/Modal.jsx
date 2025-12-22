import React, { useEffect, useRef } from 'react'

export default function Modal({ gamePuzzle, gameResult }) {
    const dialogRef = useRef(null);


    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box">
                <h3 className={`font-bold text-lg ${gameResult === "Game Over!" ? "text-red-500" : "text-green-500"}`}>{gameResult}</h3>
                {gamePuzzle ? <><h3>The hidden message is</h3> <blockquote class="p-4 mt-2 text-xl italic font-semibold tracking-tight text-heading bg-gray-300">
                    <p>{gamePuzzle}</p>
                </blockquote></> : <span></span>}

                <div className="modal-action">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn">Close</button>
                    </form>
                </div>
            </div>
        </dialog>
    )
}
