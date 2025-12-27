import { useEffect, useState } from 'react';
import type { Hit, WsMessage } from '../types/wsTypes';

export function useHit(message: WsMessage | null) {
  const [hit, setHit] = useState<Hit | null>(null);

  useEffect(() => {
    if (!message) return;
    if (message.type === 'hit') {
      const { tip, inside } = message;
      setHit({ tip, inside });
    }
  }, [message]);

  useEffect(() => {
    if (!hit) return;
    const timer = setTimeout(() => setHit(null), 6000);
    return () => clearTimeout(timer);
  }, [hit]);

  return hit;
}
