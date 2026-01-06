import { motion } from "framer-motion";
import type { Hit } from "../types/wsTypes";

interface Props {
  hit: Hit;
  pt: {
    toTarget: (p: [number, number]) => [number, number];
  };
}

export default function HitMarker({ hit, pt }: Props) {
  const [x, y] = pt.toTarget(hit.tip);
  const color = hit.inside ? "#f59e0b" : "#ef4444";

  // 🔧 여기만 조절
  const BASE_R = 14;
  const CROSS_LEN = BASE_R * 1.8;

  return (
    <g>
      {/* 파동 링 1 */}
      <motion.circle
        cx={x}
        cy={y}
        r={BASE_R}
        fill="none"
        stroke={color}
        strokeWidth={3}
        initial={{ r: BASE_R, opacity: 0.8 }}
        animate={{ r: BASE_R * 3, opacity: 0 }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
          repeat: Infinity,
          repeatDelay: 0.3,
        }}
      />

      {/* 파동 링 2 */}
      <motion.circle
        cx={x}
        cy={y}
        r={BASE_R}
        fill="none"
        stroke={color}
        strokeWidth={2}
        initial={{ r: BASE_R, opacity: 0.6 }}
        animate={{ r: BASE_R * 3.6, opacity: 0 }}
        transition={{
          duration: 1.8,
          ease: "easeOut",
          repeat: Infinity,
          repeatDelay: 0.3,
          delay: 0.5,
        }}
      />

      {/* 십자 가로 */}
      <motion.line
        x1={x - CROSS_LEN}
        y1={y}
        x2={x + CROSS_LEN}
        y2={y}
        stroke={color}
        strokeWidth={2}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />

      {/* 십자 세로 */}
      <motion.line
        x1={x}
        y1={y - CROSS_LEN}
        x2={x}
        y2={y + CROSS_LEN}
        stroke={color}
        strokeWidth={2}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />

      {/* 회전 점선 링 */}
      <motion.circle
        cx={x}
        cy={y}
        r={BASE_R * 1.5}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 3"
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />

      {/* 중심 메인 점 */}
      <motion.circle
        cx={x}
        cy={y}
        r={BASE_R}
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.3, 1, 1.1, 1],
          opacity: [0, 1, 1, 1, 1],
        }}
        transition={{
          duration: 2,
          times: [0, 0.2, 0.4, 0.7, 1],
          repeat: Infinity,
          repeatDelay: 0.5,
        }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />

      {/* 화이트 플래시 */}
      <motion.circle
        cx={x}
        cy={y}
        r={BASE_R}
        fill="white"
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0.8, 0.3, 0],
        }}
        transition={{ duration: 0.4 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />

      {/* 중앙 코어 */}
      <motion.circle
        cx={x}
        cy={y}
        r={BASE_R * 0.4}
        fill="white"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </g>
  );
}
