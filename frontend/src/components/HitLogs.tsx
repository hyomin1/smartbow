import type { HitLog } from "../types/wsTypes";
import { formatTime } from "../utils/date";

interface Props {
  hitLogs: HitLog[];
}

export default function HitLogs({ hitLogs }: Props) {
  return (
    <footer className="border-t border-stone-700 bg-stone-900 px-3 py-3 text-xl text-stone-300">
      <div className="flex flex-col gap-1">
        {hitLogs.map(({ id, ts, inside }) => (
          <div key={id}>
            [{formatTime(ts)}]{" "}
            <span className={inside ? "text-amber-400" : "text-stone-400"}>
              {inside ? "관중" : "MISS"}
            </span>
          </div>
        ))}
      </div>
    </footer>
  );
}
