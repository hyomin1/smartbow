import { motion } from 'framer-motion';
import TargetCard from '../components/TargetCard';
import { TARGETS } from '../../constants/target';
import BackgroundEffects from '../components/BackgroundEffects';
import HomePageHeader from '../components/HomePageHeader';

export default function HomePage() {
  const isDev = import.meta.env.VITE_ENV === 'dev';

  const filtered = TARGETS.filter((t) => isDev || t.id !== 'target-test');

  return (
    <div className='relative min-h-screen bg-black overflow-hidden'>
      <BackgroundEffects />

      <div className='relative z-10 container mx-auto px-6 py-12'>
        <HomePageHeader />

        <div className='max-w-6xl mx-auto'>
          <motion.div
            className='text-center mb-12'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className='text-3xl font-bold text-white font-mono mb-2 tracking-wide'>
              관을 선택해주세요
            </h2>
            <div className='w-32 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent mx-auto' />
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6'>
            {filtered.map((target, index) => (
              <TargetCard key={target.id} target={target} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
