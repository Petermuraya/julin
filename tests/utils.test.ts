import { describe, it, expect, beforeEach } from 'vitest';
import { safeSessionGet, safeSessionSet } from '@/lib/utils';

describe('safeSession helpers', () => {
  beforeEach(() => {
    // clear sessionStorage mock
    try { sessionStorage.clear(); } catch {}
  });

  it('sets and gets values safely', () => {
    safeSessionSet('foo', { a: 1 });
    const v = safeSessionGet<{ a: number }>('foo');
    expect(v).toEqual({ a: 1 });
  });

  it('returns null for missing keys', () => {
    const v = safeSessionGet('nope');
    expect(v).toBeNull();
  });
});
