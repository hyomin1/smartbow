import { motion } from 'framer-motion';

export default function HomePageHeader() {
  return (
    <motion.div
      className='text-center mb-20'
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className='inline-block mb-6'
        animate={{
          textShadow: [
            '0 0 20px rgba(0, 255, 255, 0.5)',
            '0 0 40px rgba(0, 255, 255, 0.8)',
            '0 0 20px rgba(0, 255, 255, 0.5)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <h1 className='text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 tracking-wider font-mono'>
          스마트 국궁
        </h1>
      </motion.div>

      <motion.div
        className='flex items-center justify-center gap-3'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className='w-16 h-0.5 bg-gradient-to-r from-transparent to-cyan-400'
          animate={{ scaleX: [0, 1] }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <span className='text-cyan-400 font-mono text-sm tracking-widest'>
          ARCHERY SYSTEM
        </span>
        <motion.div
          className='w-16 h-0.5 bg-gradient-to-l from-transparent to-cyan-400'
          animate={{ scaleX: [0, 1] }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>
    </motion.div>
  );
}
