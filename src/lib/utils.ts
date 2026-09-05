export { cn } from "cn"

export function humanizeDate(dateStr: string) {
  const localDate = new Date();
  const offset = localDate.getTimezoneOffset();
  const todayStr = new Date(localDate.getTime() - (offset*60*1000)).toISOString().split('T')[0];
  const target = new Date(`${dateStr}T12:00:00Z`);
  const today = new Date(`${todayStr}T12:00:00Z`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 6) {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return weekdays[target.getUTCDay()];
  }
  return dateStr;
}
