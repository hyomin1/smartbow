import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '../../constants/routes';

interface Target {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  borderColor: string;
}

interface Props {
  target: Target;
  index: number;
}

export default function TargetCard({ target, index }: Props) {
  return (
    <motion.div
      key={target.id}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
    >
      <Link to={ROUTES.STREAM(target.id)} className='group block relative'>
        <motion.div
          className='absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500'
          style={{
            background: `linear-gradient(135deg, ${target.glowColor}, transparent)`,
          }}
        />

        <div className='relative bg-black border-2 ${target.borderColor} rounded-lg overflow-hidden'>
          <div
            className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${target.borderColor}`}
          />
          <div
            className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${target.borderColor}`}
          />
          <div
            className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 ${target.borderColor}`}
          />
          <div
            className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${target.borderColor}`}
          />

          <div className='relative p-8'>
            <div className='absolute top-3 right-3 flex items-center gap-1'>
              <motion.div
                className='w-2 h-2 rounded-full bg-green-400'
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: '0 0 10px #4ade80' }}
              />
              <span className='text-green-400 text-xs font-mono'>LIVE</span>
            </div>

            <div className='text-center mb-6 mt-4'>
              <motion.h3
                className={`text-5xl font-bold bg-gradient-to-br ${target.color} bg-clip-text text-transparent mb-2 font-mono`}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {target.name}
              </motion.h3>
              <div
                className={`w-16 h-1 bg-gradient-to-r ${target.color} mx-auto`}
              />
            </div>

            <div className='space-y-2 text-center'>
              <div className='flex items-center justify-center gap-2'>
                <div className='flex gap-1'>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1 h-3 bg-gradient-to-t ${target.color}`}
                      animate={{ scaleY: [0.5, 1, 0.5] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
                <span className='text-xs text-gray-500 font-mono'>SIGNAL</span>
              </div>
            </div>

            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${target.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />

            <motion.div
              className='absolute bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div
                className={`text-xs font-mono text-gray-400 border border-gray-600 px-3 py-1 rounded-full bg-black bg-opacity-50`}
              >
                입장 →
              </div>
            </motion.div>
          </div>

          <motion.div
            className={`absolute inset-0 border-2 ${target.borderColor} opacity-0 group-hover:opacity-100 rounded-lg`}
            animate={{
              boxShadow: [
                `0 0 10px ${target.glowColor}`,
                `0 0 20px ${target.glowColor}`,
                `0 0 10px ${target.glowColor}`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
