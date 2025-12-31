import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/axios';

interface Props {
  camId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onError?: (error: string) => void;
  onConnectionStateChange?: (state: RTCIceConnectionState) => void;
  reconnectDelay?: number;
}

const DEFAULT_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 15000;

export function useWebRTC({
  camId,
  videoRef,
  onError,
  onConnectionStateChange,
  reconnectDelay = DEFAULT_RECONNECT_DELAY,
}: Props) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManualCloseRef = useRef(false);

  const [connectionState, setConnectionState] =
    useState<RTCIceConnectionState>('new');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);
  const scheduleReconnect = useCallback(
    (reason: string) => {
      if (isManualCloseRef.current) return;

      reconnectAttemptsRef.current += 1;

      const delay = Math.min(
        reconnectDelay * reconnectAttemptsRef.current,
        MAX_RECONNECT_DELAY
      );

      const msg = `${reason} (${delay / 1000}s 후 재시도)`;
      setError(msg);
      onError?.(msg);

      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    },
    [reconnectDelay, onError]
  );

  const connect = useCallback(async () => {
    try {
      cleanup();
      setIsConnecting(true);
      setError(null);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          {
            urls: [
              `turn:${import.meta.env.VITE_TURN_SERVER}:3478?transport=udp`,
              `turn:${import.meta.env.VITE_TURN_SERVER}:3478?transport=tcp`,
            ],
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ],
        iceCandidatePoolSize: 10,
      });

      pcRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        setConnectionState(state);
        onConnectionStateChange?.(state);

        if (state === 'connected' || state === 'completed') {
          reconnectAttemptsRef.current = 0;
          setError(null);
          setIsConnecting(false);
        }
        if (state === 'failed' || state === 'disconnected') {
          setIsConnecting(false);
          scheduleReconnect('카메라 연결 대기 중');
        }
      };

      pc.ontrack = (event) => {
        if (!videoRef.current || !event.streams[0]) return;

        videoRef.current.srcObject = event.streams[0];
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .catch(() => scheduleReconnect('비디오 재생 실패'));
        };
      };

      pc.addTransceiver('video', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const resp = await api.post(
        `webrtc/offer/${camId}`,
        pc.localDescription,
        {
          timeout: 10000,
        }
      );

      const answer = resp.data;

      if (!answer || !answer.type) {
        throw new Error('Invalid answer from server');
      }

      await pc.setRemoteDescription(answer);
    } catch (err) {
      setIsConnecting(false);
      scheduleReconnect(
        err instanceof Error ? err.message : 'WebRTC 연결 실패'
      );
    }
  }, [
    camId,
    videoRef,
    cleanup,
    scheduleReconnect,
    onError,
    onConnectionStateChange,
  ]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setError(null);
    connect();
  }, [connect]);

  useEffect(() => {
    isManualCloseRef.current = false;
    connect();

    return () => {
      isManualCloseRef.current = true;
      cleanup();
      reconnectAttemptsRef.current = 0;
    };
  }, [camId, connect, cleanup, videoRef]);

  return {
    connectionState,
    error,
    isConnecting,
    reconnect,
  };
}
