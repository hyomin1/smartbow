type Point = [number, number];

export function computeHomography(src: Point[], dst: Point[]) {
  // 8x8 선형방정식 풀기 (가우스 소거)
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];

    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    B.push(u);

    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    B.push(v);
  }

  // 가우스 소거 (8x8)
  for (let i = 0; i < 8; i++) {
    let maxRow = i;
    for (let k = i + 1; k < 8; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }

    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [B[i], B[maxRow]] = [B[maxRow], B[i]];

    const div = A[i][i];
    for (let j = i; j < 8; j++) A[i][j] /= div;
    B[i] /= div;

    for (let k = 0; k < 8; k++) {
      if (k === i) continue;
      const factor = A[k][i];
      for (let j = i; j < 8; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  const h = [...B, 1];

  return (p: Point): Point => {
    const [x, y] = p;
    const d = h[6] * x + h[7] * y + 1;
    return [(h[0] * x + h[1] * y + h[2]) / d, (h[3] * x + h[4] * y + h[5]) / d];
  };
}
