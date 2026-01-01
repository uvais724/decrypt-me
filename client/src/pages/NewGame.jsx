import React from 'react'
import { useNavigate } from 'react-router-dom';

export default function NewGame() {
    const navigate = useNavigate();
    const onsubmit = async (e) => {
        e.preventDefault();
        const message = e.target.Message.value;
        try {
            const response = await fetch('/api/games/new-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ promptText: message })
            });
            const data = await response.json();
            console.log(data);
            navigate('/');
        } catch (error) {
            console.error('Error submitting game:', error);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
            <div className="card w-full max-w-lg shadow-xl bg-base-100">
                <div className="card-body">
                    <h2 className="card-title">Start New Game</h2>
                    <p className="text-sm text-neutral">Enter a prompt to generate the game challenge.</p>

                    <form onSubmit={onsubmit} className="form-control mt-4">
                        <label htmlFor="Message" className="label">
                            <span className="label-text">Prompt</span>
                        </label>
                        <input
                            name="Message"
                            id="Message"
                            type="text"
                            placeholder="Type your prompt..."
                            className="input input-bordered w-full"
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
    )
}
