import React, { useEffect } from 'react'

export default function Modal({gamePuzzle, gameResult}) {
    
    useEffect(() => document.getElementById('my_modal_1').showModal(), [])

    return (
    <dialog id="my_modal_1" className="modal">
        <div className="modal-box">
            <h3 className="font-bold text-lg">{gameResult}</h3>
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
