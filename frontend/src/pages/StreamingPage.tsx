import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import StreamingHeader from "../components/StreamingHeader";

import { useWebSocket } from "../hooks/useWebSocket";
import { useVideoSize } from "../hooks/useVideoSize";
import { useHit } from "../hooks/useHit";
import useStreamingStatus from "../hooks/useStreamingStatus";
import useCamState from "../hooks/useCamState";
import CameraPanel from "../components/CameraPanel";
import type { HitLog } from "../types/wsTypes";
import HitLogs from "../components/HitLogs";
import HitMarker from "../components/HitMarker";
import { useHomographyTransform } from "../hooks/useHomographyTransform";
import TargetTest from "../components/TargetTest";
import CellNumber from "../components/CellNumber";
import CelebrationMsg from "../components/CelebrationMsg";

export default function StreamingPage() {
  const { camId } = useParams<{ camId: string }>();

  const targetVideoRef = useRef<HTMLVideoElement>(null);
  const shooterVideoRef = useRef<HTMLVideoElement>(null);

  const audioRef = useRef(new Audio("/sound/sound.mp3"))

  const [polygon, setPolygon] = useState<number[][] | null>(null);
  const [hitLogs, setHitLogs] = useState<HitLog[]>([]);

  const {
    send,
    message,
    readyState,
    error: wsError,
  } = useWebSocket(camId || "");

  const targetCam = useCamState();
  const shooterCam = useCamState();

  const renderRect = useVideoSize(targetVideoRef);

  const hit = useHit(message); //{ tip: [519, 443], inside: true, id: Date.now() }; //
  const pt = useHomographyTransform(polygon, renderRect);

const speak = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 이미 재생 중이면 처음으로 되감기 (연속 적중 시 대응)
    audio.pause();
    audio.currentTime = 0;
    
    // 재생 시도 (사용자 상호작용 후 호출되어야 함)
    audio.play()
    .then(() => {
      // 실제 스피커로 소리가 나가기 시작할 때 실행됨
      console.log("오디오 재생 성공! (Postman 데이터 수신됨)");
    })
    .catch(e => {
      // 자동 재생 정책 등으로 막혔을 때 실행됨
      console.warn("⚠️ 오디오 재생 실패:", e.message);
      console.info("브라우저 화면을 한 번 클릭한 뒤 다시 시도해 보세요.");
    });
  };

  useEffect(() => {
    if (!hit) return;

    if (hit.inside) {
      speak();
    }

    setHitLogs((prev) => {
      const next = [
        { id: hit.id, ts: Date.now(), inside: hit.inside },
        ...prev,
      ];
      return next.slice(0, 5);
    });
  }, [hit]);

  const isDev = import.meta.env.VITE_ENV === "dev";

  const { wsStatus, hasError, currentError } = useStreamingStatus({
    readyState,
    targetCamState: targetCam.state,
    shooterCamState: shooterCam.state,
    wsError,
    targetCamError: targetCam.error,
    shooterCamError: shooterCam.error,
  });

  useEffect(() => {
    if (!renderRect || !camId || readyState !== WebSocket.OPEN) return;

    send({
      type: "video_size",
      width: renderRect.w,
      height: renderRect.h,
    });
  }, [renderRect, camId, send, readyState]);

  useEffect(() => {
    if (message?.type === "polygon") {
      setPolygon(message.points);
    }
  }, [message]);

  if (!camId) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <span className="text-xl text-red-500">유효한 카메라가 아닙니다</span>
      </div>
    );
  }

  const headerStatus = {
    ws: wsStatus,
    cams: {
      target: targetCam.state,
      shooter: shooterCam.state,
    },
    camId,
    error: {
      hasError,
      message: currentError,
    },
  };

  return (
    <div className="flex h-screen flex-col bg-stone-900">
      <StreamingHeader status={headerStatus} />

      <main className="flex h-full flex-1 flex-col items-center justify-center gap-4 overflow-y-auto sm:flex-row sm:overflow-hidden">
        <CameraPanel
          camId={camId}
          label={camId}
          videoRef={targetVideoRef}
          onError={targetCam.onError}
          onConnectionStateChange={targetCam.onStateChange}
        >
          {pt && hit && renderRect && (
            <svg
              width={renderRect.w}
              height={renderRect.h}
              viewBox={`0 0 ${renderRect.w} ${renderRect.h}`}
              className="pointer-events-none absolute inset-0"
            >
              <rect
                x={0}
                y={0}
                width={renderRect.w}
                height={renderRect.h}
                className="fill-stone-900"
              />
              <g
                transform={`translate(${pt.targetRect.x}, ${pt.targetRect.y})`}
              >
                {hit.inside && <CelebrationMsg width={pt.targetRect.w} />}

                <TargetTest
                  width={pt.targetRect.w}
                  height={pt.targetRect.h}
                  rows={3}
                  cols={3}
                />
                <CellNumber
                  width={pt.targetRect.w}
                  height={pt.targetRect.h}
                  rows={3}
                  cols={3}
                />
                <HitMarker hit={hit} pt={pt} />
              </g>
            </svg>
          )}
        </CameraPanel>

        <CameraPanel
          camId={isDev ? "shooter-test" : "shooter1"}
          label={isDev ? "shooter-test" : "shooter1"}
          videoRef={shooterVideoRef}
          onError={shooterCam.onError}
          onConnectionStateChange={shooterCam.onStateChange}
        />
      </main>

      <HitLogs hitLogs={hitLogs} />
    </div>
  );
}
