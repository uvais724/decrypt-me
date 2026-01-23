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
  const [error, setError] = useState('');

  const {user} = useAuth();

  const handleSendInvite = async () => {
    if (!username || !relationshipType) return;

    setLoading(true);
    try {
      //check if the invitation already exists
      const userId = user.id;

      const { count, error:checkError } = await supabase
        .from('user_relationships')
        .select('*', { count: 'exact', head: true })
        .or(
          `and(user_id.eq.${userId},related_user_id.eq.${checkUser.user_id},status.eq.ACCEPTED),and(user_id.eq.${checkUser.user_id},related_user_id.eq.${userId},status.eq.ACCEPTED)`
        );

      if (checkError) {
        throw checkError;
      } 

      if(count >= 1) {
        setError('You already have an accepted relationship. Cannot send more invites.');
        setLoading(false);
        return;
      }

      const {data: invitesData, error: invitesError } = await supabase
        .from('relationship_invites')
        .select('*');
      if (invitesError) {
        throw invitesError;
      }

      const existingInvite = invitesData.find(invite => 
        (invite.inviter_id === user.id && invite.invitee_id === checkUser.user_id && invite.status === 'PENDING') ||
        (invite.inviter_id === checkUser.user_id && invite.invitee_id === user.id && invite.status === 'PENDING')
      );

      if(existingInvite) {
        setError('An invite is already pending between you and this user.');
        setLoading(false);
        return;
      }

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
        setUsername('');
        setRelationshipType('');
        setCheckUser(false);
        setCheckUserFlag(null);
      }

      if(inviteError) throw error;

    } catch (err) {
      console.error('Invite error:', err.message);
      setError('Failed to send invite. Please try again later.');
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
      setError('Something went wrong while checking the user. Please try again later.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center mt-8">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Send Invite</h2>
            {error && (
                <div className="alert alert-error shadow-lg">
                  <span>{error}</span>
                </div>
            )}
            <div className="flex gap-2">
              <input
                className="input input-bordered"
                placeholder="Invitee email"
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
