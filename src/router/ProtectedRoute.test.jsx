import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../context/authContextValue';

function renderProtected(authValue) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/']}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<main>Private Area</main>} />
          </Route>
          <Route path="/login" element={<main>Login Page</main>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is resolving', () => {
    expect(renderProtected({ user: null, loading: true })).toContain('Loading...');
  });

  it('renders nested routes for authenticated users', () => {
    expect(renderProtected({ user: { id: 'user-1' }, loading: false })).toContain('Private Area');
  });

  it('does not render private content for anonymous users', () => {
    expect(renderProtected({ user: null, loading: false })).not.toContain('Private Area');
  });
});
