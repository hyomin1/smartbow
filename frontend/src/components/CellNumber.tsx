import { motion } from "framer-motion";

interface Props {
  width: number;
  height: number;
  rows: number;
  cols: number;
}

export default function CellNumber({ width, height, rows, cols }: Props) {
  const cellW = width / cols;
  const cellH = height / rows;

  return (
    <>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = (c + 0.5) * cellW;
          const y = (r + 0.5) * cellH;
          const num = r * cols + c + 1;
          const delay = (r * cols + c) * 0.01;

          return (
            <motion.text
              key={`${r}-${c}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-amber-400/40 text-3xl font-bold select-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: 0.8 + delay,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            >
              {num}
            </motion.text>
          );
        }),
      )}
    </>
  );
}
