import TargetCard from '../components/TargetCard';
import { TARGETS } from '../../constants/target';

export default function HomePage() {
  const isDev = import.meta.env.VITE_ENV === 'dev';
  const filtered = TARGETS.filter((t) => isDev || t.id !== 'target-test');

  return (
    <div className='min-h-screen bg-stone-950 text-stone-200'>
      <div className='container mx-auto px-4 sm:px-6 py-12 sm:py-20'>
        <header className='text-center mb-12 sm:mb-16'>
          <h1 className='text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-wide text-stone-100'>
            스마트 <span className='text-amber-600'>國弓</span>
          </h1>
        </header>

        <main className='max-w-3xl mx-auto space-y-12'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            {filtered.map((target) => (
              <TargetCard key={target.id} target={target} />
            ))}
          </div>

          <footer className='border-t border-stone-900 pt-6 sm:pt-8 text-center'>
            <p className='text-stone-500 text-xs tracking-wide'>
              © 스마트 국궁 시스템
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
