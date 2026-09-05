export function periodContains(start: Date, end: Date | null, periodStart: Date, periodEnd: Date) {
  return start <= periodEnd && (end === null || end >= periodStart);
}

export function daysInclusive(start: Date, end: Date) {
  return Math.floor((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000) + 1;
}
