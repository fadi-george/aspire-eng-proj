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

export const isReleaseSeen = (
  lastSeenAt: string | null,
  publishedAt: string | null,
) => {
  if (!lastSeenAt || !publishedAt) {
    return false;
  }
  const lastSeen = new Date(lastSeenAt);
  const published = new Date(publishedAt);
  return lastSeen.getTime() >= published.getTime();
};

export const hasNewRelease = (
  lastSeenAt: string | null,
  publishedAt: string | null,
) => {
  if (!publishedAt) return false;
  if (!lastSeenAt) return true;
  return Date.parse(publishedAt) > Date.parse(lastSeenAt);
};
