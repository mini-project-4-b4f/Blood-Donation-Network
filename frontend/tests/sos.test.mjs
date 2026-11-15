import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext.tsx';
import SosRequestCard from '../src/pages/SosBoard/SosRequestCard.tsx';
import { getSosRequests } from '../src/services/requests.api.ts';

test('public request cards render only public data and server-supplied units', () => {
  const request = {
    id: 'request-test', bloodType: 'A-', area: { id: 'homs', name: 'Homs' }, urgency: 'CRITICAL',
    hospital: 'Test Hospital', unitsStillNeeded: 3, createdAt: '2026-11-01T09:10:00Z',
    patientReference: 'PRIVATE-PATIENT', note: 'PRIVATE-NOTE', donorName: 'PRIVATE-DONOR',
  };
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(AuthProvider, null, createElement(SosRequestCard, { request }))));
  assert.match(html, /Test Hospital/);
  assert.match(html, /3 units/);
  assert.match(html, /01 Nov 2026, 09:10 UTC/);
  assert.match(html, /href="\/sign-in"/);
  assert.doesNotMatch(html, /PRIVATE-/);
});

test('the SOS API preserves the server array order', async (t) => {
  const response = [{ id: 'high-first', urgency: 'HIGH' }, { id: 'critical-second', urgency: 'CRITICAL' }];
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'http://localhost:3000/api/requests/sos');
    return Response.json(response);
  });
  assert.deepEqual(await getSosRequests(), response);
});
