import { computeHomography } from "../utils/computeHomography";

type Point = [number, number];

export type HomographyResult = {
  toTarget: (p: Point) => Point; // polygon → 과녁 로컬 좌표
  targetRect: {
    x: number; // 화면상 offsetX
    y: number; // 화면상 offsetY
    w: number; // 과녁 width
    h: number; // 과녁 height
  };
};
const ASPECT_W = 3;
const ASPECT_H = 4;
export function useHomographyTransform(
  polygon: number[][] | null,
  renderRect: { w: number; h: number } | null,
  scale = 0.6,
): HomographyResult | null {
  if (!polygon || polygon.length !== 4 || !renderRect) {
    return null;
  }

  const src: Point[] = polygon.map(([x, y]) => [x, y]);

  const base = Math.min(renderRect.w / ASPECT_W, renderRect.h / ASPECT_H);
  const targetW = base * ASPECT_W * scale;
  const targetH = base * ASPECT_H * scale;

  const offsetX = (renderRect.w - targetW) / 2;
  const offsetY = (renderRect.h - targetH) / 2;

  const dst: Point[] = [
    [0, 0],
    [targetW, 0],
    [targetW, targetH],
    [0, targetH],
  ];

  // 5️⃣ homography 계산
  const toTarget = computeHomography(src, dst);

  return {
    toTarget,
    targetRect: {
      x: offsetX,
      y: offsetY,
      w: targetW,
      h: targetH,
    },
  };
}
