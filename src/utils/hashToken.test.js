import { describe, expect, it } from 'vitest';
import { hashToken } from './hashToken';

describe('hashToken', () => {
  it('returns a SHA-256 hex digest', async () => {
    await expect(hashToken('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });
});
