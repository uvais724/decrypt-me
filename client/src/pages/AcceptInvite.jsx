import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/invalid-invite' ,{ replace: true });
      return;
    }

    if (!loading && !user) {
      // 🚀 Redirect to login WITH invite token
      navigate(`/login?inviteToken=${token}`,{ replace: true });
      return;
    }

    if (!loading && user) {
      // ✅ User is logged in → accept invite
      navigate(`/accept-invite/confirm?token=${token}`,{ replace: true });
    }
  }, [user, loading]);

  return <p>Checking invite…</p>;
}
