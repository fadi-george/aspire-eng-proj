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
