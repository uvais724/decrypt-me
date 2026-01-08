import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import Navbar from '../components/Navbar';

export default function NewGame() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [relatedUsers, setRelatedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedUsers = async () => {
            try {
                const response = await apiClient.get(`/users/related/${user.id}`);
                setRelatedUsers(response.data);
                setLoading(false);
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
        const message = e.target.Message.value;
        try {
            const response = await apiClient.post('/api/games/new-game', {
                promptText: message,
                userId: user.id,
                recipientId: selectedUser
            });
            const data = await response.data;
            console.log(data);
            navigate('/');
        } catch (error) {
            console.error('Error submitting game:', error);
        }
    }

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
