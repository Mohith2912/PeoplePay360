export function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function decimal(value) {
    return roundMoney(value);
}
