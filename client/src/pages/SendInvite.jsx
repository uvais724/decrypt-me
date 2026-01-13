import { useState } from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function SendInvite() {
  const [username, setUsername] = useState('');
  const [checkUser, setCheckUser] = useState(false);
  const [checkUserFlag, setCheckUserFlag] = useState(null);
  const [relationshipType, setRelationshipType] = useState('');
  const [loading, setLoading] = useState(false);

  const {user} = useAuth();

  const handleSendInvite = async () => {
    if (!username || !relationshipType) return;

    setLoading(true);
    try {
      const { data: inviteData, error: inviteError } = await supabase
      .from('relationship_invites')
      .insert({
        inviter_id: user.id,
        invitee_id: checkUser.user_id,
        relationship_type: relationshipType,
        status: 'PENDING'
      })
      .select();
      
      if(inviteData) {
        alert('Invite send successfully!');
      }

      if(inviteError) throw error;

    } catch (err) {
      console.error('Invite error:', err.message);
    } finally {
      setLoading(false);
    } 
  };

  const handleUserCheck = async () => {
    if(!username) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

       if(data && data.user_id !== user.id) {
          setCheckUser(data);
          setCheckUserFlag(true);
       } else {
        throw new Error('You cannot add you own username!');
       }

       if(error) throw error;
    } catch(err) {
      console.error('Error while checking user: ', err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center mt-8">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Send Invite</h2>

            <div className="flex gap-2">
              <input
                className="input input-bordered"
                placeholder="Invitee username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleUserCheck}>Check</button>
            </div>
            <select
              className="select select-bordered mt-2 w-full"
              value={relationshipType}
              onChange={e => setRelationshipType(e.target.value)}
            >
              <option value="">Select Relationship</option>
              <option value="partner">Partner</option>
              <option value="friend">Friend</option>
              <option value="family">Family</option>
              <option value="other">Other</option>
            </select>

            <button
              className="btn btn-primary mt-4"
              onClick={handleSendInvite}
              disabled={!checkUserFlag}
            >
              Send Invite
            </button>

            <Link to="/" className="btn btn-ghost mt-2">Cancel</Link>
          </div>
        </div>
      </div>
    </>
  );
}
