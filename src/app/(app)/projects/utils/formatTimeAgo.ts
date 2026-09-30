/** Formats date into human-readable relative time */
export function formatTimeAgo(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "Just now";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), "minute");
  if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), "hour");
  if (diffSec < 604800) return rtf.format(-Math.floor(diffSec / 86400), "day");

  return date.toLocaleDateString();
}
