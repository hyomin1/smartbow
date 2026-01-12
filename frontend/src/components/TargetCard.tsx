import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

interface Target {
  id: string;
  name: string;
}

interface Props {
  target: Target;
}

export default function TargetCard({ target }: Props) {
  const { id, name } = target;
  const isOnline = name === "3관";

  return (
    <Link
      to={isOnline ? ROUTES.STREAM(id) : "#"}
      className={`block rounded-sm border p-4 transition-colors sm:p-5 lg:p-6 ${
        isOnline
          ? "border-stone-800 bg-stone-900 hover:border-amber-600 hover:bg-stone-800"
          : "pointer-events-none cursor-not-allowed border-stone-800 bg-stone-900 opacity-40"
      } `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-stone-200 sm:text-2xl lg:text-3xl">
            {name}
          </h3>
          <p className="text-sm text-stone-400">실시간 스트리밍</p>
        </div>

        <span
          className={`text-xs ${
            isOnline ? "text-green-500" : "text-stone-500"
          }`}
        >
          {isOnline ? "ONLINE" : "OFFLINE"}
        </span>
      </div>
    </Link>
  );
}
