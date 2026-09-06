export function periodContains(start, end, periodStart, periodEnd) {
    return start <= periodEnd && (end === null || end >= periodStart);
}
export function daysInclusive(start, end) {
    return Math.floor((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000) + 1;
}
