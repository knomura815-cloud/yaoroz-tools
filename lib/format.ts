// 浮動小数点の丸め誤差（例: 3300/1.1 = 2999.9999999999995）を吸収してから切り捨てる
export function formatYen(value: number): string {
  return `${Math.floor(value + 1e-6).toLocaleString("ja-JP")}円`;
}

export function formatCount(value: number, unit: string): string {
  return `${Math.floor(value).toLocaleString("ja-JP")}${unit}`;
}

export function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDecimal(value: number, unit: string): string {
  return `${value.toFixed(2)}${unit}`;
}
