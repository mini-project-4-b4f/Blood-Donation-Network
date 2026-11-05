import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAreas, getMe, signIn, signUpDonor } from '../src/services/auth.api.ts';

test('auth service calls the exact endpoints and returns their unwrapped shapes', async (t) => {
  const calls = [];
  const user = { id: 'coordinator', role: 'COORDINATOR', donorProfile: null };
  const auth = { accessToken: 'token', user };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, method: options.method ?? 'GET', body: options.body });
    return Response.json(url.endsWith('/areas') ? [] : url.endsWith('/auth/me') ? user : auth);
  });
  assert.deepEqual(await getAreas(), []);
  assert.deepEqual(await getMe(), user);
  assert.deepEqual(await signIn({ identifier: '0933112233', password: 'Password123' }), auth);
  assert.deepEqual(calls.map(({ url, method }) => [url, method]), [
    ['http://localhost:3000/api/areas', 'GET'],
    ['http://localhost:3000/api/auth/me', 'GET'],
    ['http://localhost:3000/api/auth/sign-in', 'POST'],
  ]);
  assert.deepEqual(JSON.parse(calls[2].body), { identifier: '0933112233', password: 'Password123' });
});

test('registration omits blank email and preserves the exact required payload fields', async (t) => {
  const bodies = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'http://localhost:3000/api/auth/sign-up');
    assert.equal(options.method, 'POST');
    bodies.push(JSON.parse(options.body));
    return Response.json({ accessToken: 'token', user: {} }, { status: 201 });
  });
  const payload = { fullName: 'Sara', phone: '0933112233', password: 'Password123', bloodType: 'A-', areaId: 'area-homs' };
  await signUpDonor({ ...payload, email: '  ' });
  await signUpDonor({ ...payload, email: ' SARA@EXAMPLE.COM ' });
  assert.deepEqual(bodies, [payload, { ...payload, email: 'sara@example.com' }]);
});

test('auth services propagate backend rejection text unchanged', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'An account with this phone number is already registered.' }, { status: 409 }));
  await assert.rejects(signUpDonor({}), (error) => error.status === 409 && error.message === 'An account with this phone number is already registered.');
});
