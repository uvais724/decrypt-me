import React from 'react'
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function SendInvite() {
    const [username, setUsername] = React.useState('');
    const [relationshipType, setRelationshipType] = React.useState('');
    const [magicLink, setMagicLink] = React.useState('');

    const { user } = useAuth();

    const handleSendInvite = async () => {
        console.log('Logged in user:', user);
        try {
            const response = await axios.post('/api/invites/send', {
                userId: user.userId,
                inviteeUsername: username,
                relationshipType: relationshipType,
            });
            const data = await response.data;
            console.log('Invite sent successfully:', data);
            setMagicLink(data.magicLink);
        } catch (error) {
            console.error('Error sending invite:', error);
        }
    };

    const copyMagicLink = async () => {
        if (!magicLink) return;
        try {
            await navigator.clipboard.writeText(magicLink);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    return (
        <>
            <Navbar />
            <div className="flex justify-center mt-8">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">Send Invite</h2>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Invitee username</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter username to invite"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Relationship type</span>
                            </label>
                            <select
                                name="relationship_type"
                                id="relationship_type"
                                value={relationshipType}
                                onChange={(e) => setRelationshipType(e.target.value)}
                                className="select select-bordered w-full"
                            >
                                <option value="">Select Relationship Type</option>
                                <option value="partner">Partner</option>
                                <option value="friend">Friend</option>
                                <option value="family">Family</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button className="btn btn-primary flex-1" onClick={handleSendInvite}>
                                Send Invite
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => { setUsername(''); setRelationshipType(''); setMagicLink(''); }}
                            >
                                Reset
                            </button>
                        </div>

                        <div className="mt-4">
                            <label className="label">
                                <span className="label-text">Magic Link</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={magicLink}
                                    placeholder="No link yet"
                                    className="input input-bordered w-full"
                                />
                                <button className="btn" onClick={copyMagicLink} disabled={!magicLink}>
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}