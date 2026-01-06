import { motion } from "framer-motion";

interface Props {
  width: number;
}

export default function CelebrationMsg({ width }: Props) {
  const centerX = width / 2;
  const centerY = -56;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.circle
        cx={centerX}
        cy={centerY}
        r={20}
        fill="none"
        stroke="#fbbf24"
        strokeWidth={2}
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.8, opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* 텍스트 그림자 (가독성용) */}
      <motion.text
        x={centerX}
        y={centerY + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="38"
        fontWeight="bold"
        fill="#000"
        opacity={0.35}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "3px",
        }}
      >
        관중
      </motion.text>

      {/* 메인 텍스트 */}
      <motion.text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="38"
        fontWeight="bold"
        fill="#fde047" // 밝은 노랑 (가독성 ↑)
        filter="url(#softGlow)"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: 1,
        }}
        transition={{
          duration: 0.6,
          ease: "easeOut",
        }}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "3px",
        }}
      >
        관중
      </motion.text>
    </motion.g>
  );
}
