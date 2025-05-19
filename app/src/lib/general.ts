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
