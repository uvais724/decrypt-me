import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  //const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the login function from context
      await login({ username });
      // Navigate to games page on successful login
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body">
            <h1 className="card-title text-3xl font-bold text-center mb-2">Decrypt Me</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="form-control">
                <label className="label p-2">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="input input-bordered"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              {/*<div className="form-control">
                <label className="label">
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
              </div>*/}

              {/* Error Message */}
              {error && (
                <div className="alert alert-error shadow-lg">
                  <div>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
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
                  'Login'
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            {/*<div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/signup" className="link link-primary font-semibold">
                  Sign up here
                </a>
              </p>
            </div>*/}
          </div>
        </div>
      </div>
    </div>
  );
}
