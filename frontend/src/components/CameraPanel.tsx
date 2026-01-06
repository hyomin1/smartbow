import { useWebRTC } from "../hooks/useWebRTC";

interface Props {
  camId: string;
  label: string;

  videoRef: React.RefObject<HTMLVideoElement | null>;

  onError?: (error: string) => void;
  onConnectionStateChange?: (state: RTCIceConnectionState) => void;
  children?: React.ReactNode;
}

export default function CameraPanel({
  camId,
  label,
  videoRef,

  onError,
  onConnectionStateChange,
  children,
}: Props) {
  const { connectionState, error, isConnecting } = useWebRTC({
    camId,
    videoRef,
    onError,
    onConnectionStateChange,
  });

  const stateLabel = (() => {
    if (isConnecting) return "연결 중...";
    if (error) return "연결 오류";

    switch (connectionState) {
      case "connected":
      case "completed":
        return null;
      case "checking":
        return "연결 확인 중...";
      case "new":
        return "대기 중...";
      case "disconnected":
        return "연결 끊김";
      case "failed":
        return "연결 실패";
      case "closed":
        return "연결 종료";
      default:
        return null;
    }
  })();

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full border-2 border-stone-600 object-contain`}
      />

      {stateLabel && !error && (
        <div className="absolute top-2 right-2 z-20 rounded bg-yellow-500/80 px-3 py-1 font-mono text-xs text-black">
          {stateLabel}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <div className="mb-2 font-mono text-lg text-red-500">
              ⚠️ 연결 오류
            </div>
            <div className="font-mono text-sm text-gray-300">{error}</div>
          </div>
        </div>
      )}

      <div
        className={`pointer-events-none absolute top-2 left-2 z-20 rounded border border-amber-500/60 bg-stone-800 px-2 py-1 text-[11px] font-medium text-amber-400`}
      >
        {label}
      </div>

      {children}
    </div>
  );
}
