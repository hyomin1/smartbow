import type { Weather } from "../types/weather";

interface Props {
  weather: Weather;
}

export default function WeatherSection({ weather }: Props) {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-6 rounded-xl border-2 border-stone-700 bg-black/60 px-6 py-2.5 shadow-xl">
        <div className="flex items-baseline gap-1 border-r-2 border-stone-800 pr-6">
          <span className="text-4xl font-black tracking-tighter text-white">
            {weather.temp.toFixed(1)}
          </span>
          <span className="text-xl font-bold text-orange-500">°C</span>
        </div>

        <div className="flex items-center gap-3 border-r-2 border-stone-800 pr-6">
          <div className="flex flex-col items-start">
            <span className="mb-1 text-[10px] leading-none font-black text-stone-500 uppercase">
              풍향
            </span>
            <span className="text-base leading-none font-black text-stone-200">
              {weather.wind_dir}풍
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl leading-none font-black tracking-tighter text-sky-400">
              {weather.wind_speed.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-stone-500">m/s</span>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-3xl leading-none font-black text-stone-300 tabular-nums">
            {weather.base_hour}
          </span>
          <span className="text-lg leading-none font-bold tracking-tight text-stone-500">
            시 기준
          </span>
        </div>
      </div>
    </div>
  );
}
