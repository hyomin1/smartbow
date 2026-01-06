import { motion } from "framer-motion";

interface Props {
  width: number;
  height: number;
  rows?: number;
  cols?: number;
}

export default function TargetTest({
  width,
  height,
  rows = 3,
  cols = 3,
}: Props) {
  const cellW = width / cols;
  const cellH = height / rows;

  return (
    <g>
      {/* 1. 배경 글로우: 전체가 번쩍하며 등장 */}
      <motion.rect
        width={width}
        height={height}
        className="fill-amber-500/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.2, 0.05] }}
        transition={{ duration: 1, times: [0, 0.2, 1] }}
      />

      {/* 2. 메인 프레임: 밖에서 안으로 조여오며 등장 */}
      <motion.rect
        x={0}
        y={0}
        width={width}
        height={height}
        className="fill-transparent stroke-amber-400 stroke-[1px]"
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{ transformOrigin: "center" }}
      />

      {/* 4. 가로/세로 그리드: 중앙에서 양옆으로 찢어지며 등장 */}
      <g>
        {Array.from({ length: cols - 1 }).map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={(i + 1) * cellW}
            y1={0}
            x2={(i + 1) * cellW}
            y2={height}
            className="stroke-amber-300/40 stroke-[1px]"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2 * i, duration: 0.5, ease: "circOut" }}
            style={{ transformOrigin: "center" }}
          />
        ))}
        {Array.from({ length: rows - 1 }).map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1={0}
            y1={(i + 1) * cellH}
            x2={width}
            y2={(i + 1) * cellH}
            className="stroke-amber-300/40 stroke-[1px]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2 * i, duration: 0.5, ease: "circOut" }}
            style={{ transformOrigin: "center" }}
          />
        ))}
      </g>
    </g>
  );
}
