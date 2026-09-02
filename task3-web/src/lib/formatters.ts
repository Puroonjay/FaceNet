export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function truncateHex(hex: string, front = 10, back = 8): string {
  if (!hex || hex.length <= front + back) return hex || "None";
  return `${hex.slice(0, front)}...${hex.slice(-back)}`;
}

export function formatUtcTimestamp(epoch: number): string {
  if (!epoch) return "None";
  const d = new Date(epoch * 1000);
  return d.toISOString().replace("T", " ").replace("Z", " UTC");
}

export function getConfidencePercentage(scoreStr?: string): number {
  if (!scoreStr) return 92;
  const match = scoreStr.match(/(\d+(\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return num <= 1 ? Math.round(num * 100) : Math.min(100, Math.round(num));
  }
  return 92;
}
