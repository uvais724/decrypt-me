import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';

export default function Invites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAllInvites = async () => {
      try {
        const response = await apiClient.get('/invites');
        if (response.status === 200) {
          setInvites(response.data);
        }
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
      await apiClient.post(`/invites/accept/${inviteId}`);
      setInvites(prev => prev.filter(i => i.invite_id !== inviteId));
    } catch (err) {
      console.error('Failed to accept invite', err);
    }
  };

  const rejectInvite = async (inviteId) => {
    try {
      await apiClient.post(`/invites/reject/${inviteId}`);
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
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold mb-6">Invites</h1>
          <Link className="btn btn-primary btn-sm" to="/send-invite">
            <button>
              Send Invite
            </button>
          </Link>
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
