export function toDateString(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Cannot format an invalid date.');
  }

  // UTC conversion can move a local calendar date into the previous or next day.
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return toDateString(new Date());
}
