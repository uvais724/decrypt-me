import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

function Consumer() {
  const auth = useAuth();
  return <span>{`${auth.loading}:${auth.user}:${typeof auth.login}:${typeof auth.logout}`}</span>;
}

describe('AuthProvider', () => {
  it('provides auth state and auth actions to descendants', () => {
    expect(renderToStaticMarkup(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )).toContain('true:null:function:function');
  });
});
