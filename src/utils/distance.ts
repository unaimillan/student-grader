export function levenshtein(source: string, target: string): number {
  const n = source.length;
  const m = target.length;

  if (n === 0) {
    return m;
  }
  if (m === 0) {
    return n;
  }

  const matrix: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0)
  );

  for (let i = 0; i <= n; i += 1) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= m; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 0; i < n; i += 1) {
    const sourceChar = source[i];
    for (let j = 0; j < m; j += 1) {
      const targetChar = target[j];
      const cost = sourceChar === targetChar ? 0 : 1;
      matrix[i + 1][j + 1] = Math.min(
        matrix[i][j + 1] + 1,
        matrix[i + 1][j] + 1,
        matrix[i][j] + cost
      );
    }
  }

  return matrix[n][m];
}
