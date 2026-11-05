import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { getTodayString, toDateString } from '../src/utils/date.ts';
import {
  formatDate,
  formatDateTime,
  formatPhone,
  formatUnits,
} from '../src/utils/format.ts';

test('calendar dates preserve their day and use the documented display format', () => {
  assert.equal(formatDate('2026-12-27'), '27 Dec 2026');
  assert.equal(formatDate('2024-02-29'), '29 Feb 2024');
  assert.equal(formatDate('2026-12-31'), '31 Dec 2026');
  assert.equal(formatDate('2027-01-01'), '01 Jan 2027');
});

test('invalid or impossible calendar dates do not silently roll over', () => {
  for (const value of ['', 'invalid', '2026-02-29', '2026-02-30', '2026-13-01']) {
    assert.equal(formatDate(value), '—');
  }
});

test('API timestamps display in UTC, including equivalent offset timestamps', () => {
  assert.equal(formatDateTime('2026-11-01T09:10:00.000Z'), '01 Nov 2026, 09:10');
  assert.equal(formatDateTime('2026-11-01T12:10:00+03:00'), '01 Nov 2026, 09:10');
  assert.equal(formatDateTime('2026-12-31T23:59:00Z'), '31 Dec 2026, 23:59');
  assert.equal(formatDateTime('invalid'), '—');
});

test('unit labels distinguish one unit from zero and multiple units', () => {
  assert.equal(formatUnits(0), '0 units');
  assert.equal(formatUnits(1), '1 unit');
  assert.equal(formatUnits(3), '3 units');
});

test('phone display preserves country prefixes, leading zeroes and separators', () => {
  assert.equal(formatPhone('  +963 933-112233  '), '+963 933-112233');
  assert.equal(formatPhone('0933112233'), '0933112233');
});

test('local date helpers pad calendar parts and reject invalid dates', () => {
  assert.equal(toDateString(new Date(2026, 0, 2, 12)), '2026-01-02');
  assert.equal(toDateString(new Date(2026, 11, 31, 12)), '2026-12-31');
  assert.equal(getTodayString(), toDateString(new Date()));
  assert.throws(() => toDateString(new Date('invalid')), RangeError);
});

test('local dates stay correct near midnight in both directions from UTC', () => {
  const dateModule = new URL('../src/utils/date.ts', import.meta.url).href;
  const formatModule = new URL('../src/utils/format.ts', import.meta.url).href;
  const script = `
    import assert from 'node:assert/strict';
    import { toDateString } from '${dateModule}';
    import { formatDate, formatDateTime } from '${formatModule}';
    assert.equal(toDateString(new Date(2027, 0, 1, 0, 15)), '2027-01-01');
    assert.equal(toDateString(new Date(2026, 11, 31, 23, 45)), '2026-12-31');
    assert.equal(formatDate('2024-02-29'), '29 Feb 2024');
    assert.equal(formatDateTime('2026-11-01T09:10:00Z'), '01 Nov 2026, 09:10');
  `;

  // Separate processes let each case start with its own real timezone setting.
  for (const timeZone of ['Asia/Damascus', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      env: { ...process.env, TZ: timeZone },
      stdio: 'pipe',
    });
  }
});
