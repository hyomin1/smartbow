import { useLayoutEffect, useState, useRef } from "react";

export function useVideoSize(ref: React.RefObject<HTMLVideoElement | null>) {
  const [rect, setRect] = useState<{ w: number; h: number } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const video = ref.current;
    if (!video) return;

    const update = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      const r = video.getBoundingClientRect();

      setRect((prev) => {
        if (prev && prev.w === r.width && prev.h === r.height) {
          return prev;
        }
        return { w: r.width, h: r.height };
      });
    };

    const debouncedUpdate = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(update, 100);
    };

    update();
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("playing", update);
    window.addEventListener("resize", debouncedUpdate);

    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      video.removeEventListener("loadedmetadata", update);
      video.removeEventListener("playing", update);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [ref]);

  return rect;
}
