import { getStateColor, getStateLabel } from "../utils/webrtc";
import useWeather from "../hooks/useWeather";
import WeatherSection from "./WeatherSection";
import TimeSection from "./TimeSection";

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
  const { data, isLoading, isError } = useWeather();
  const weather = data?.data;

  return (
    <header className="border-b border-stone-700 bg-stone-900 px-3 py-3">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-2">
          <TimeSection />
          {!isLoading && !isError && weather && (
            <WeatherSection weather={weather} />
          )}
        </div>

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
