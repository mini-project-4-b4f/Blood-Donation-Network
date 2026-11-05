import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthProvider, useAuth } from '../src/context/AuthContext.tsx';

function Consumer() {
  const auth = useAuth();
  return createElement('p', null, `${auth.user === null}:${auth.token === null}:${auth.isAuthLoading}:${auth.areas.length}`);
}

test('useAuth explains a missing provider clearly', () => {
  assert.throws(() => renderToStaticMarkup(createElement(Consumer)), /useAuth must be used inside AuthProvider/);
});

test('a new visitor starts without a session or a loading loop', () => {
  assert.equal(renderToStaticMarkup(createElement(AuthProvider, null, createElement(Consumer))), '<p>true:true:false:0</p>');
});
