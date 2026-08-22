import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AppLayout from './AppLayout';
import { AuthContext } from '../context/authContextValue';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('AppLayout', () => {
  it('renders the navbar and nested page outlet', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/']}>
        <AuthContext.Provider value={{ user: { id: 'user-1', email: 'u@example.com' }, logout: vi.fn() }}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<main>Dashboard</main>} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(markup).toContain('Decrypt-Me');
    expect(markup).toContain('Dashboard');
  });
});
