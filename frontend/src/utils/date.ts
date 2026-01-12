export function formatDate(date = new Date()) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}년 ${
    date.getMonth() + 1
  }월 ${date.getDate()}일 (${days[date.getDay()]})`;
}
export function formatTime(ts: number) {
  const d = ts ? new Date(ts) : new Date();

  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");

  return ts ? `${h}시 ${m}분 ${s}초` : `${h}:${m}`;
}

export function formatShortTime(date = new Date()) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
