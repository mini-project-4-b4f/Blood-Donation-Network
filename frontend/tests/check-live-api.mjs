import assert from 'node:assert/strict';

const baseURL = (process.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

async function read(path) {
  const response = await fetch(`${baseURL}${path}`, { signal: AbortSignal.timeout(5000) });
  const body = await response.json();
  return { response, body };
}

try {
  const { response: areasResponse, body: areas } = await read('/areas');
  assert.equal(areasResponse.status, 200, 'GET /areas must return 200');
  assert.ok(Array.isArray(areas), 'Areas must be an unwrapped array');
  for (const area of areas) assert.ok(typeof area.id === 'string' && typeof area.name === 'string');
  console.log('PASS: areas status and shape');

  const { response: sosResponse, body: requests } = await read('/requests/sos');
  assert.equal(sosResponse.status, 200, 'GET /requests/sos must return 200');
  assert.ok(Array.isArray(requests), 'SOS requests must be an unwrapped array');
  const allowedKeys = ['area', 'bloodType', 'createdAt', 'hospital', 'id', 'unitsStillNeeded', 'urgency'];
  const rank = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
  for (const [index, request] of requests.entries()) {
    assert.deepEqual(Object.keys(request).sort(), allowedKeys, 'The public endpoint must expose only approved fields');
    assert.deepEqual(Object.keys(request.area).sort(), ['id', 'name']);
    assert.ok(Number.isInteger(request.unitsStillNeeded) && request.unitsStillNeeded >= 0);
    assert.ok(Number.isFinite(Date.parse(request.createdAt)));
    assert.ok(Object.hasOwn(rank, request.urgency));
    if (index > 0) {
      const previous = requests[index - 1];
      assert.ok(rank[previous.urgency] <= rank[request.urgency], 'Urgency order must be CRITICAL, HIGH, NORMAL');
      if (previous.urgency === request.urgency) assert.ok(Date.parse(previous.createdAt) <= Date.parse(request.createdAt), 'Older requests must come first');
    }
  }
  console.log(`PASS: SOS privacy, shape and ordering (${requests.length} requests)`);

  const { response: meResponse, body: meError } = await read('/auth/me');
  assert.equal(meResponse.status, 401, 'GET /auth/me without a token must return 401');
  assert.equal(meError.message, 'Authentication required. Please sign in.');
  console.log('PASS: unauthenticated session rejection');
  console.log('Live read-only API checks passed. Registration and signed-in flows still require seeded test accounts.');
} catch (error) {
  console.error(`Live API checks incomplete at ${baseURL}: ${error.message}`);
  process.exitCode = 1;
}
