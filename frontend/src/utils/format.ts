const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
});

export function formatDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return '—';
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  // Reject impossible dates instead of letting JavaScript roll them into a new month.
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateStr) {
    return '—';
  }

  return DATE_FORMATTER.format(date);
}

export function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  // Display API timestamps in UTC, matching the examples in the task contract.
  return `${DATE_FORMATTER.format(date)}, ${TIME_FORMATTER.format(date)}`;
}

export function formatUnits(units: number): string {
  return `${units} ${units === 1 ? 'unit' : 'units'}`;
}

export function formatPhone(phone: string): string {
  // Keep the country prefix and leading zeroes; this helper is for display only.
  return phone.trim();
}
