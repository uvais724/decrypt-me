import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { hashToken } from '../utils/hashToken';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function SendInvite() {
  const [username, setUsername] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleSendInvite = async () => {
    if (!username || !relationshipType) return;

    setLoading(true);
    try {
      const token = crypto.randomUUID();
      const tokenHash = await hashToken(token);

      const expiresAt = new Date(Date.now() + 86400000).toISOString();

      const { error } = await supabase
        .from('relationship_invites')
        .insert({
          inviter_id: user.id,
          invitee_username: username,
          relationship_type: relationshipType,
          token_hash: tokenHash,
          expires_at: expiresAt
        });

      if (error) throw error;

      setMagicLink(
        `${window.location.origin}/invite/accept?token=${token}`
      );
    } catch (err) {
      console.error('Invite error:', err.message);
    } finally {
      setLoading(false);
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

            <input
              className="input input-bordered"
              placeholder="Invitee username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />

            <select
              className="select select-bordered mt-2"
              value={relationshipType}
              onChange={e => setRelationshipType(e.target.value)}
            >
              <option value="">Select Relationship</option>
              <option value="partner">Partner</option>
              <option value="friend">Friend</option>
              <option value="family">Family</option>
            </select>

            <button
              className="btn btn-primary mt-4"
              onClick={handleSendInvite}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>

            {magicLink && (
              <div className='flex justify-center-safe items-center gap-1'>
                <input
                  className="input input-bordered mt-4"
                  readOnly
                  value={magicLink}
                />
                <button className="btn mt-3.5" onClick={copyMagicLink} disabled={!magicLink}>
                  Copy
                </button>
              </div>
            )}

            <Link to="/" className="btn btn-ghost mt-2">Cancel</Link>
          </div>
        </div>
      </div>
    </>
  );
}
