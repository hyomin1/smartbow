export type TargetGeometry = {
  scaledPolygon: number[][];
  verticalLines: { top: number[]; bottom: number[] }[];
  horizontalLines: { left: number[]; right: number[] }[];
  getCellCenter: (row: number, col: number) => [number, number];
  getScaledPoint: (p: number[]) => [number, number];
};

export default function useTargetGeometry(
  polygon: number[][] | null,
  renderRect: { w: number; h: number } | null,
  scale = 1.3,
): TargetGeometry | null {
  if (!polygon || !renderRect) {
    return null;
  }
  const lerp = (p1: number[], p2: number[], t: number) => [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t,
  ];

  const center = polygon
    .reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0])
    .map((v) => v / polygon.length);

  const screenCenter = [renderRect.w / 2, renderRect.h / 2];

  const scaledPolygon = polygon.map(([x, y]) => [
    screenCenter[0] + (x - center[0]) * scale,
    screenCenter[1] + (y - center[1]) * scale,
  ]);

  const [A, B, C, D] = scaledPolygon;

  const verticalLines = [1 / 3, 2 / 3].map((t) => ({
    top: lerp(A, B, t),
    bottom: lerp(D, C, t),
  }));

  const horizontalLines = [1 / 3, 2 / 3].map((t) => ({
    left: lerp(A, D, t),
    right: lerp(B, C, t),
  }));

  const getCellCenter = (row: number, col: number): [number, number] => {
    //  좌상단
    const tl = lerp(lerp(A, B, col / 3), lerp(D, C, col / 3), row / 3);

    //  우하단
    const br = lerp(
      lerp(A, B, (col + 1) / 3),
      lerp(D, C, (col + 1) / 3),
      (row + 1) / 3,
    );

    // 중심
    return [(tl[0] + br[0]) / 2, (tl[1] + br[1]) / 2];
  };
  const getScaledPoint = ([x, y]: number[]): [number, number] => [
    screenCenter[0] + (x - center[0]) * scale,
    screenCenter[1] + (y - center[1]) * scale,
  ];

  return {
    scaledPolygon,
    verticalLines,
    horizontalLines,
    getCellCenter,
    getScaledPoint,
  };
}
