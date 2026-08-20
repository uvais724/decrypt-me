import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/useAuth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to retrieve session. Please try logging in again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (data?.session) {
          // Session is valid, redirect to home
          navigate('/');
        } else {
          // No session found
          setError('Login failed. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An error occurred during authentication.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    // Only run after auth context has loaded
    if (!loading) {
      if (user) {
        // User is already authenticated
        navigate('/');
      } else {
        // Try to complete the callback
        handleAuthCallback();
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="text-center">
        {error ? (
          <div className="card bg-base-100 shadow-2xl w-full max-w-md">
            <div className="card-body">
              <h2 className="card-title text-error">Authentication Failed</h2>
              <p className="text-base-content/80">{error}</p>
              <p className="text-sm text-base-content/60">Redirecting to login...</p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-2xl w-full max-w-md">
            <div className="card-body items-center">
              <h2 className="card-title">Completing Login</h2>
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-base-content/80">Please wait while we complete your sign-in...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
