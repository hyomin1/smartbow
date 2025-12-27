import { motion } from 'framer-motion';
import type { Hit } from '../types/wsTypes';

interface Props {
  hit: Hit;
  polygon: number[][];
  renderRect: { w: number; h: number };
  isVisible?: boolean;
}

export default function TargetOverlayView({
  hit,
  polygon,
  renderRect,
  isVisible = true,
}: Props) {
  if (!polygon || polygon.length < 4) return null;

  const lerp = (p1: number[], p2: number[], t: number) => [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t,
  ];

  const centerX = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
  const centerY = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;

  const screenCenterX = renderRect.w / 2;
  const screenCenterY = renderRect.h / 2;

  const scale = 1.3;

  const scaledPolygon = polygon.map(([x, y]) => [
    screenCenterX + (x - centerX) * scale,
    screenCenterY + (y - centerY) * scale,
  ]);

  const isInside = hit.inside;

  const [sA, sB, sC, sD] = scaledPolygon;

  const verticalLines = [1 / 3, 2 / 3].map((t) => ({
    top: lerp(sA, sB, t),
    bottom: lerp(sD, sC, t),
  }));

  const horizontalLines = [1 / 3, 2 / 3].map((t) => ({
    left: lerp(sA, sD, t),
    right: lerp(sB, sC, t),
  }));

  const scaledHit = hit
    ? [
        screenCenterX + (hit.tip[0] - centerX) * scale,
        screenCenterY + (hit.tip[1] - centerY) * scale,
      ]
    : null;

  // --- 색상 테마 설정 ---
  const hitColors = isInside
    ? {
        main: '#ffd700', // Gold
        secondary: '#ffaa00', // Orange
        accent: '#ffffcc', // Light Yellow
        wave1: 'rgba(255,215,0,0.6)',
        wave2: 'rgba(255,170,0,0.8)',
      }
    : {
        main: '#ff4444', // Red
        secondary: '#cc0000', // Dark Red
        accent: '#ffcccc', // Light Pink
        wave1: 'rgba(255,68,68,0.6)',
        wave2: 'rgba(204,0,0,0.8)',
      };

  return (
    <svg
      width={renderRect.w}
      height={renderRect.h}
      viewBox={`0 0 ${renderRect.w} ${renderRect.h}`}
      className='absolute inset-0'
      preserveAspectRatio='none'
      style={{
        position: 'absolute',
        inset: 0,
      }}
    >
      <defs>
        <filter id='glow'>
          <feGaussianBlur stdDeviation='2' result='coloredBlur' />
          <feMerge>
            <feMergeNode in='coloredBlur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>

        <filter id='strongGlow'>
          <feGaussianBlur stdDeviation='4' result='coloredBlur' />
          <feMerge>
            <feMergeNode in='coloredBlur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>

        <linearGradient id='borderGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#00ffff' stopOpacity='0.8' />
          <stop offset='50%' stopColor='#00ff88' stopOpacity='0.9' />
          <stop offset='100%' stopColor='#00ffff' stopOpacity='0.8' />
        </linearGradient>

        <radialGradient id='hitGradient'>
          <stop offset='0%' stopColor={hitColors.main} stopOpacity='0.8' />
          <stop
            offset='70%'
            stopColor={hitColors.secondary}
            stopOpacity='0.4'
          />
          <stop offset='100%' stopColor={hitColors.secondary} stopOpacity='0' />
        </radialGradient>

        <radialGradient id='celebrationGlow'>
          <stop offset='0%' stopColor='#FFD700' stopOpacity='0.8' />
          <stop offset='50%' stopColor='#FFA500' stopOpacity='0.4' />
          <stop offset='100%' stopColor='#FF6347' stopOpacity='0' />
        </radialGradient>
      </defs>

      {isInside && (
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <motion.circle
            cx={renderRect.w / 2}
            cy={48}
            r={50}
            fill='url(#celebrationGlow)'
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.8], opacity: [0.6, 0.3, 0] }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <motion.text
            x={renderRect.w / 2}
            y={48}
            textAnchor='middle'
            dominantBaseline='middle'
            fill='#FFD700'
            fontSize='36'
            fontWeight='bold'
            filter='url(#strongGlow)'
            animate={{ scale: [1, 1.08, 1.04, 1], y: [48, 45, 48] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              letterSpacing: '3px',
            }}
          >
            관중
          </motion.text>
          {[...Array(6)].map((_, i) => (
            <motion.text
              key={i}
              x={renderRect.w / 2 + Math.cos((i * Math.PI * 2) / 6) * 60}
              y={48 + Math.sin((i * Math.PI * 2) / 6) * 60}
              textAnchor='middle'
              dominantBaseline='middle'
              fontSize='20'
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            >
              ✨
            </motion.text>
          ))}
        </motion.g>
      )}

      <polygon
        points={scaledPolygon.map(([x, y]) => `${x},${y}`).join(' ')}
        fill='rgba(0,255,200,0.02)'
      />

      <motion.polygon
        points={scaledPolygon.map(([x, y]) => `${x},${y}`).join(' ')}
        fill='none'
        stroke='url(#borderGradient)'
        strokeWidth={2}
        filter='url(#glow)'
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: 1,
          opacity: 1,
          strokeWidth: isVisible ? [2, 2.5, 2] : 2,
        }}
        transition={{
          pathLength: { duration: 1.5, ease: 'easeInOut' },
          opacity: { duration: 0.5 },
          strokeWidth: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {verticalLines.map(({ top, bottom }, i) => (
        <motion.line
          key={`v${i}`}
          x1={top[0]}
          y1={top[1]}
          x2={bottom[0]}
          y2={bottom[1]}
          stroke='rgba(0,255,255,0.2)'
          strokeWidth={1}
          strokeDasharray='8 6'
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
        />
      ))}

      {horizontalLines.map(({ left, right }, i) => (
        <motion.line
          key={`h${i}`}
          x1={left[0]}
          y1={left[1]}
          x2={right[0]}
          y2={right[1]}
          stroke='rgba(0,255,255,0.2)'
          strokeWidth={1}
          strokeDasharray='8 6'
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
        />
      ))}

      {(() => {
        const cellNumbers = [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ];
        const getCellCenter = (row: number, col: number) => {
          const topLeft = lerp(
            lerp(sA, sB, col / 3),
            lerp(sD, sC, col / 3),
            row / 3
          );
          const bottomRight = lerp(
            lerp(sA, sB, (col + 1) / 3),
            lerp(sD, sC, (col + 1) / 3),
            (row + 1) / 3
          );
          return [
            (topLeft[0] + bottomRight[0]) / 2,
            (topLeft[1] + bottomRight[1]) / 2,
          ];
        };
        return cellNumbers.flatMap((row, rowIdx) =>
          row.map((num, colIdx) => {
            const [x, y] = getCellCenter(rowIdx, colIdx);
            return (
              <motion.text
                key={`cell-${num}`}
                x={x}
                y={y}
                textAnchor='middle'
                dominantBaseline='middle'
                fill='#00ffff'
                fontSize='32'
                opacity={0.3}
                filter='url(#glow)'
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.8 + (rowIdx * 3 + colIdx) * 0.05,
                }}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {num}
              </motion.text>
            );
          })
        );
      })()}

      {scaledHit && (
        <g>
          <motion.circle
            cx={scaledHit[0]}
            cy={scaledHit[1]}
            r={20}
            fill='none'
            stroke={hitColors.wave1}
            strokeWidth={2}
            initial={{ r: 10, opacity: 0 }}
            animate={
              isVisible
                ? {
                    r: [10, 40, 60],
                    opacity: [0.8, 0.4, 0],
                    strokeWidth: [3, 2, 1],
                  }
                : { r: 10, opacity: 0 }
            }
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />

          <motion.circle
            cx={scaledHit[0]}
            cy={scaledHit[1]}
            r={20}
            fill='none'
            stroke={hitColors.wave2}
            strokeWidth={2.5}
            initial={{ r: 10, opacity: 0 }}
            animate={
              isVisible
                ? { r: [10, 35, 50], opacity: [1, 0.5, 0] }
                : { r: 10, opacity: 0 }
            }
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.3,
            }}
          />

          <motion.circle
            cx={scaledHit[0]}
            cy={scaledHit[1]}
            r={18}
            fill='url(#hitGradient)'
            animate={
              isVisible
                ? { scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }
                : { scale: 1, opacity: 0.4 }
            }
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          <motion.g
            animate={isVisible ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: `${scaledHit[0]}px ${scaledHit[1]}px` }}
          >
            {[
              { x1: -15, y1: 0, x2: -8, y2: 0 },
              { x1: 8, y1: 0, x2: 15, y2: 0 },
              { x1: 0, y1: -15, x2: 0, y2: -8 },
              { x1: 0, y1: 8, x2: 0, y2: 15 },
            ].map((l, i) => (
              <line
                key={i}
                x1={scaledHit[0] + l.x1}
                y1={scaledHit[1] + l.y1}
                x2={scaledHit[0] + l.x2}
                y2={scaledHit[1] + l.y2}
                stroke={hitColors.secondary}
                strokeWidth={2}
                opacity={0.8}
              />
            ))}
          </motion.g>

          <motion.circle
            cx={scaledHit[0]}
            cy={scaledHit[1]}
            r={12}
            fill='none'
            stroke={hitColors.secondary}
            strokeWidth={2}
            filter='url(#strongGlow)'
            animate={
              isVisible
                ? { r: [10, 13, 10], opacity: [0.8, 1, 0.8] }
                : { r: 12, opacity: 1 }
            }
            transition={{ duration: 1, repeat: Infinity }}
          />

          <motion.circle
            cx={scaledHit[0]}
            cy={scaledHit[1]}
            r={5}
            fill={hitColors.main}
            filter='url(#strongGlow)'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          />

          <motion.circle
            cx={scaledHit[0]}
            cy={scaledHit[1]}
            r={2.5}
            fill={hitColors.accent}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 15,
              delay: 0.05,
            }}
          />
        </g>
      )}
    </svg>
  );
}
