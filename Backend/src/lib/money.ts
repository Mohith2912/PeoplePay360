export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function decimal(value: number): number {
  return roundMoney(value);
}
