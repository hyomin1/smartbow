import { useEffect, useState } from "react";
import { formatDate } from "../utils/date";
import { getStateColor, getStateLabel } from "../utils/webrtc";

interface HeaderStatus {
  ws: { label: string; color: string };
  cams: { target: RTCIceConnectionState; shooter: RTCIceConnectionState };
  camId: string;
  error: { hasError: boolean; message: string | null };
}
interface Props {
  status: HeaderStatus;
}

export default function StreamingHeader({ status }: Props) {
  const { ws, cams, camId } = status;
  const { label, color } = ws;
  const { target, shooter } = cams;
  const name = camId.replace("target", "");
  const [, forceRender] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      forceRender((v) => v + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="border-b border-stone-700 bg-stone-900 px-3 py-3">
      <div className="flex h-full items-center justify-between">
        <div className="text-2xl font-bold text-stone-400">{formatDate()}</div>

        <div className="flex items-center gap-3 font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">{name}관</span>
            <span
              className={`rounded border border-stone-700 bg-black/40 px-2 py-0.5 font-medium ${color} `}
            >
              {label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">과녁</span>
            <span
              className={`rounded border border-stone-700 bg-black/40 px-2 py-0.5 font-medium ${getStateColor(target)} `}
            >
              {getStateLabel(target)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">사대</span>
            <span
              className={`rounded border border-stone-700 bg-black/40 px-2 py-0.5 font-medium ${getStateColor(shooter)} `}
            >
              {getStateLabel(shooter)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
