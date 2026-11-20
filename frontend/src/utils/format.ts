export function formatDate(dateStr: string, language: 'en' | 'ar' = 'en'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return '—';
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  // Reject impossible dates instead of letting JavaScript roll them into a new month.
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateStr) {
    return '—';
  }

  return new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function formatDateTime(isoStr: string, language: 'en' | 'ar' = 'en'): string {
  const date = new Date(isoStr);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  // Display API timestamps in UTC, matching the examples in the task contract.
  const dateFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const timeFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;
}

export function formatUnits(units: number, language: 'en' | 'ar' = 'en'): string {
  const unitLabel = language === 'ar' ? (units === 1 ? 'وحدة' : 'وحدات') : (units === 1 ? 'unit' : 'units');
  return `${new Intl.NumberFormat(language === 'ar' ? 'ar' : 'en').format(units)} ${unitLabel}`;
}

export function formatPhone(phone: string): string {
  // Keep the country prefix and leading zeroes; this helper is for display only.
  return phone.trim();
}
