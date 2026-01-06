import { useState } from 'react';

export default function useCamState() {
  const [state, setState] = useState<RTCIceConnectionState>('new');
  const [error, setError] = useState<string | null>(null);

  return {
    state,
    error,
    onStateChange: setState,
    onError: setError,
  };
}
