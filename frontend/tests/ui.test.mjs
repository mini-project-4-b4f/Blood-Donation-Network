import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Loading from '../src/components/common/Loading.tsx';
import ErrorMessage from '../src/components/common/ErrorMessage.tsx';
import EmptyState from '../src/components/common/EmptyState.tsx';
import Button from '../src/components/common/Button.tsx';
import StatusBadge from '../src/components/common/StatusBadge.tsx';
import UrgencyBadge from '../src/components/common/UrgencyBadge.tsx';
import BloodTypeBadge from '../src/components/common/BloodTypeBadge.tsx';

const render = (component, props) => renderToStaticMarkup(createElement(component, props));

test('feedback components provide accessible text and optional retry/actions', () => {
  assert.match(render(Loading, { message: 'Loading requests' }), /role="status".*Loading requests/);
  assert.match(render(ErrorMessage, { message: 'Try later' }), /role="alert"/);
  assert.doesNotMatch(render(ErrorMessage, { message: 'Try later' }), /<button/);
  assert.match(render(ErrorMessage, { message: 'Try later', onRetry() {} }), /Try again/);
  assert.match(render(EmptyState, { title: 'All clear', description: 'No requests', action: createElement('a', { href: '/' }, 'Home') }), /All clear.*No requests.*Home/);
});

test('buttons preserve form/ARIA props and cannot submit while loading', () => {
  assert.match(render(Button, { children: 'Save' }), /type="button"/);
  const html = render(Button, { type: 'submit', isLoading: true, 'aria-label': 'Save', children: 'Save' });
  assert.match(html, /type="submit"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /aria-label="Save"/);
  assert.match(html, /Working/);
  assert.match(render(Button, { disabled: true, isLoading: false }), /disabled=""/);
});

test('all button variants and sizes are supported', () => {
  for (const variant of ['primary', 'secondary', 'danger', 'outline']) {
    for (const size of ['sm', 'md', 'lg']) {
      const html = render(Button, { variant, size });
      assert.ok(html.includes(`ui-button--${variant}`) && html.includes(`ui-button--${size}`));
    }
  }
});

test('all domain badges render explicit labels, not only colors', () => {
  for (const status of ['OPEN', 'FULFILLED', 'CANCELLED', 'PLEDGED', 'COMPLETED', 'WITHDRAWN', 'RELEASED', 'ELIGIBLE', 'REST_PERIOD', 'UNAVAILABLE', 'INACTIVE']) {
    assert.ok(render(StatusBadge, { status }).includes(status.replaceAll('_', ' ')));
  }
  for (const urgency of ['CRITICAL', 'HIGH', 'NORMAL']) assert.ok(render(UrgencyBadge, { urgency }).includes(urgency));
  assert.match(render(BloodTypeBadge, { bloodType: 'A-', isExactMatch: true }), /Blood type A-.*Exact Match/);
  assert.doesNotMatch(render(BloodTypeBadge, { bloodType: 'O+' }), /Exact Match/);
});
