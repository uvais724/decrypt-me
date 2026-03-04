import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Invites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const getAllInvites = async () => {
      try {
        const { data, error } = await supabase
          .from('relationship_invites')
          .select(`
            invite_id, 
            inviter_id, 
            invitee_id, 
            relationship_type, 
            status, 
            created_at,
            inviter:users!inviter_id(username) // Get the name of the person who sent it
          `)
          .eq('invitee_id', user.id) // Filter directly on the main table column
          .eq('status', 'PENDING');

        if (data) {
          const result = data.map(i => ({
            invite_id: i.invite_id,
            inviter_id: i.inviter_id,
            inviter_username: i.inviter?.username,
            relationship_type: i.relationship_type,
            status: i.status,
            created_at: i.created_at
          }));
          setInvites(result);
        }
        if (error) throw error;
      } catch (err) {
        console.error('Error while trying to fetch invites', err);
      } finally {
        setLoading(false);
      }
    };

    getAllInvites();
  }, []);

  const acceptInvite = async (inviteId) => {
    try {
      const { data: invite, error: inviteErr } = await supabase
        .from('relationship_invites')
        .select('*')
        .eq('status', 'PENDING')
        .eq('invite_id', inviteId)
        .single();

      if (inviteErr) throw inviteErr;

      const { data: invitee, error: inviteeErr } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', invite.invitee_id)
        .single();

      if(inviteeErr) throw inviteeErr;

      const { error: insertErr } = await supabase.from('user_relationships').insert({
        user_id: invitee.user_id,
        related_user_id: invite.inviter_id,
        relationship_type: invite.relationship_type,
        status: 'ACCEPTED',
        initiated_by: invitee.user_id
      });

      if(insertErr) throw insertErr;

      const {error: deleteInviteErr } = await supabase
        .from('relationship_invites')
        .delete()
        .eq('invite_id', invite.invite_id);

      if(deleteInviteErr) throw deleteInviteErr;

      setInvites(prev => prev.filter(i => i.invite_id !== inviteId));

    } catch (err) {
      console.error('Failed to accept invite', err);
    }
  };

  const rejectInvite = async (inviteId) => {
    try {
      const { data: invite, error: inviteErr } = await supabase
        .from('relationship_invites')
        .select('*')
        .eq('status', 'PENDING')
        .eq('invite_id', inviteId)
        .single();

      if(inviteErr) throw inviteErr;

      const { error } = await supabase
        .from('relationship_invites')
        .update({ status: 'REJECTED' })
        .eq('invite_id', invite.invite_id);

      if(error) throw error;

      const {error: deleteInviteErr } = await supabase
        .from('relationship_invites')
        .delete()
        .eq('invite_id', invite.invite_id);

      if(deleteInviteErr) throw deleteInviteErr;

      setInvites(prev => prev.filter(i => i.invite_id !== inviteId));

    } catch (err) {
      console.error('Failed to reject invite', err);
    }
  };

  const badgeFor = (type) => {
    if (!type) return 'badge badge-neutral';
    const map = {
      partner: 'badge-success',
      friend: 'badge-info',
      family: 'badge-warning',
      other: 'badge-outline'
    };
    return `badge ${map[type.toLowerCase()] || 'badge-outline'}`;
  };

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-6">Invites</h1>
          <Link className="btn btn-primary btn-sm" to="/send-invite">
            <button>
              Send Invite
            </button>
          </Link>
        </div>

        <div className="alert alert-info shadow-lg mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 mx-2 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Once an invite is accepted, the user will be available to send games under the <b>Send to</b> dropdown on <Link to="/new-game" className="link link-primary font-semibold">new-game page</Link>.</span>
        </div>

        {loading ? (
          <Loading />
        ) : (!invites || invites.length === 0) ? (
          <div className="py-16">
            <p className="text-center italic text-neutral">No invites</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {invites.map(inv => (
              <div key={inv.invite_id} className="card card-compact bg-base-200 shadow hover:shadow-xl transition">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="card-title">Invite from {inv.inviter_username || 'Unknown'}</h2>
                      <p className="text-sm text-muted">Type: <span className="font-medium">{inv.relationship_type}</span></p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={badgeFor(inv.relationship_type)}>{inv.relationship_type}</span>
                      <span className="text-xs text-neutral mt-2">{new Date(inv.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button onClick={() => rejectInvite(inv.invite_id)} className="btn btn-ghost btn-sm mr-2">Reject</button>
                    <button onClick={() => acceptInvite(inv.invite_id)} className="btn btn-primary btn-sm">Accept</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
