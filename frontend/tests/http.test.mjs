import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, clearStoredToken, getStoredToken, request, setStoredToken } from '../src/services/http.ts';

// Node has no browser storage, so give its mock tracker a replaceable property.
Object.defineProperty(globalThis, 'localStorage', { value: null, writable: true, configurable: true });

function mockStorage(t) {
  const stored = new Map();
  t.mock.property(globalThis, 'localStorage', {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: (key) => stored.delete(key),
  });
  return stored;
}

test('HTTP uses one API prefix, attaches the token and preserves the body', async (t) => {
  const stored = mockStorage(t);
  setStoredToken('test-token');
  assert.equal(stored.get('bdn.token'), 'test-token');
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'http://localhost:3000/api/auth/sign-in');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    assert.equal(options.method, 'POST');
    assert.equal(options.body, '{"identifier":"0933112233"}');
    return Response.json({ accessToken: 'new-token' });
  });
  assert.deepEqual(await request('/auth/sign-in', { method: 'POST', body: '{"identifier":"0933112233"}' }), { accessToken: 'new-token' });
  clearStoredToken();
  assert.equal(getStoredToken(), null);
});

test('HTTP preserves exact backend error statuses and messages', async (t) => {
  mockStorage(t);
  for (const status of [400, 401, 403, 409, 500]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'Backend explanation.' }, { status }));
    await assert.rejects(request('/areas'), (error) => error instanceof ApiError && error.status === status && error.message === 'Backend explanation.');
    mock.mock.restore();
  }
});

test('network and malformed responses produce readable errors', async (t) => {
  mockStorage(t);
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  await assert.rejects(request('/areas'), (error) => error.status === 0 && error.message === 'Cannot reach the server. Please check your connection and try again.');
  mock.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Error</html>', { status: 500 }));
  await assert.rejects(request('/areas'), /Something went wrong\. Please try again\./);
});

test('blocked storage still permits a session in the current tab', (t) => {
  t.mock.property(globalThis, 'localStorage', {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  });
  setStoredToken('memory-token');
  assert.equal(getStoredToken(), 'memory-token');
  clearStoredToken();
  assert.equal(getStoredToken(), null);
});
