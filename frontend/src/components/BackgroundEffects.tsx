import { motion } from 'framer-motion';

export default function BackgroundEffects() {
  return (
    <>
      <div className='absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-cyan-950 opacity-60' />

      <div
        className='absolute inset-0 opacity-10'
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, 0.3) 25%, rgba(0, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.3) 75%, rgba(0, 255, 255, 0.3) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, 0.3) 25%, rgba(0, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.3) 75%, rgba(0, 255, 255, 0.3) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'linear-gradient(0deg, transparent 0%, rgba(0, 255, 255, 0.03) 50%, transparent 100%)',
          backgroundSize: '100% 4px',
        }}
        animate={{ y: [0, 100] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </>
  );
}
