import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GameRefreshProvider } from './GameRefreshContext';
import { useGameRefresh } from './useGameRefresh';

function Consumer() {
  const { refreshTrigger, triggerRefresh } = useGameRefresh();
  return <span>{`${refreshTrigger}:${typeof triggerRefresh}`}</span>;
}

describe('GameRefreshProvider', () => {
  it('provides the refresh trigger and updater function', () => {
    expect(renderToStaticMarkup(
      <GameRefreshProvider>
        <Consumer />
      </GameRefreshProvider>
    )).toContain('0:function');
  });
});
