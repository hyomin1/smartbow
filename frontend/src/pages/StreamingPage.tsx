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
  useEffect(() => {
    if (!hit) return;

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

      <main className="flex h-full flex-1 items-center justify-center gap-4 p-2">
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
