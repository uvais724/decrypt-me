// ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can render a spinner here while checking auth status
    return <div>Loading...</div>;
  }

  // If the user is logged in, render the child routes, otherwise redirect to login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
