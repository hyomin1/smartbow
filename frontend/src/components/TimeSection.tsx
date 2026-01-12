import { useEffect, useState } from "react";
import { formatDate, formatShortTime } from "../utils/date";

export default function TimeSection() {
  const [timeStr, setTimeStr] = useState({
    date: formatDate(),
    time: formatShortTime(),
  });

  useEffect(() => {
    const updateTime = () => {
      setTimeStr({ date: formatDate(), time: formatShortTime() });
    };

    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000;

    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="mr-4 flex items-center gap-4 border-r-2 border-stone-700 pr-6">
      <span className="text-2xl font-black tracking-tight text-stone-300">
        {timeStr.date}
      </span>

      <span className="text-4xl font-black tracking-tighter text-white">
        {timeStr.time}
      </span>
    </div>
  );
}
