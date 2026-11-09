/** A short, rounded length for lists: "under 1 min", "6 min", "1 h 5 min". */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0 min";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 1) return "under 1 min";

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
