export const formatNumber = (number: number, decimals: number = 0) => {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: decimals,
  }).format(number);
};
