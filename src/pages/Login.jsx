import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import HowToPlay from '../components/HowToPlay';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      // Supabase errors come with a message property
      if(err.message === 'Email not confirmed') {
        setError('Go to your email inbox to confirm your account before logging in.');
      } else {
        setError(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryNow = () => {
    navigate('/demo-game');
  };

  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // queryParams: {
          //   access_type: 'offline',
          //   prompt: 'consent',
          // },
        },
      });

      if (oauthError) {
        console.error('OAuth Error:', oauthError);
        setError('Failed to connect with Google. Please try again.');
        setGoogleLoading(false);
        return;
      }

      // If no error but no URL redirect, something went wrong
      if (!data?.url) {
        setError('Failed to initialize Google sign-in. Please try again.');
        setGoogleLoading(false);
      }
      // The redirect will happen automatically, but set loading in case it takes time
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <HowToPlay isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h1 className="card-title text-3xl font-bold">
                Decrypt Me
              </h1>
              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                className="btn btn-ghost btn-sm text-sm"
              >
                How to Play ?
              </button>
            </div>

            {/* Try Now Button */}
            <button
              type="button"
              className="btn btn-accent w-full"
              onClick={handleTryNow}
              disabled={loading || googleLoading}
            >
              Try Now
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="alert alert-error shadow-lg">
                  <span>{error}</span>
                </div>
              )}
              {/* Email */}
              <div className="form-control flex justify-between">
                <label className="label py-2 px-5">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input input-bordered"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="form-control flex justify-between">
                <label className="label p-2">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="input input-bordered"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>


              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Logging in...
                  </>
                ) : (
                  'Sign in | Sign Up'
                )}
              </button>
            </form>

            {/* Google Login */}
            <button
              type="button"
              className="btn bg-white text-black border-[#e5e5e5] w-full disabled:opacity-50"
              onClick={signInWithGoogle}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Signing in with Google...
                </>
              ) : (
                <>
                  <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
                  Login with Google
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
