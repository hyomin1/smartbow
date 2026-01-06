import { getWebSocketStatus, isSystemOnline } from '../utils/webrtc';

interface Params {
  readyState: WebSocket['readyState'];
  targetCamState: RTCIceConnectionState;
  shooterCamState: RTCIceConnectionState;
  wsError: string | null;
  targetCamError: string | null;
  shooterCamError: string | null;
}

export default function useStreamingStatus({
  readyState,
  targetCamState,
  shooterCamState,
  wsError,
  targetCamError,
  shooterCamError,
}: Params) {
  const wsStatus = getWebSocketStatus(readyState);

  const hasError = Boolean(wsError || targetCamError || shooterCamError);
  const currentError = wsError || targetCamError || shooterCamError;

  const isOnline = isSystemOnline(readyState, targetCamState, shooterCamState);

  return { wsStatus, hasError, currentError, isOnline };
}
