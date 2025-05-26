export const formatNumber = (number: number, decimals: number = 0) => {
  return Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: decimals,
  }).format(number);
};

export const formatDate = (
  date: string,
  options: Intl.DateTimeFormatOptions = {},
) => {
  return Intl.DateTimeFormat(undefined, options).format(new Date(date));
};

export const hasNewRelease = ({
  last_seen_at,
  published_at,
}: {
  last_seen_at: string | null;
  published_at: string | null;
}) => {
  if (!published_at) return false;
  if (!last_seen_at) return true;
  return Date.parse(published_at) > Date.parse(last_seen_at);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number = 350,
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  }) as T;
}
