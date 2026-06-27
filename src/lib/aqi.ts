export interface AqiInfo {
  label: string;
  /** Tailwind text color class */
  textClass: string;
  /** Tailwind bg color class */
  bgClass: string;
  /** Tailwind border color class */
  borderClass: string;
  /** Raw hex for inline styles / SVG */
  hex: string;
  /** Short advice for the user */
  advice: string;
  /** 0-100 severity used for ring fill */
  severity: number;
}

/**
 * Maps the US EPA Air Quality Index to colors and labels.
 * Reference: https://www.airnow.gov/aqi/aqi-basics/
 */
export function getAqiInfo(aqi: number | null | undefined): AqiInfo | null {
  if (aqi == null || Number.isNaN(aqi)) return null;

  if (aqi <= 50) {
    return {
      label: "Good",
      textClass: "text-emerald-700 dark:text-emerald-300",
      bgClass: "bg-emerald-100 dark:bg-emerald-950/50",
      borderClass: "border-emerald-300/70 dark:border-emerald-800/60",
      hex: "#10b981",
      advice: "Air quality is satisfactory — ideal for outdoor activity.",
      severity: (aqi / 50) * 17,
    };
  }
  if (aqi <= 100) {
    return {
      label: "Moderate",
      textClass: "text-amber-700 dark:text-amber-300",
      bgClass: "bg-amber-100 dark:bg-amber-950/50",
      borderClass: "border-amber-300/70 dark:border-amber-800/60",
      hex: "#f59e0b",
      advice: "Acceptable, but unusually sensitive people should limit prolonged outdoor exertion.",
      severity: 17 + ((aqi - 50) / 50) * 17,
    };
  }
  if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive",
      textClass: "text-orange-700 dark:text-orange-300",
      bgClass: "bg-orange-100 dark:bg-orange-950/50",
      borderClass: "border-orange-300/70 dark:border-orange-800/60",
      hex: "#f97316",
      advice: "Sensitive groups (children, elderly, asthma) should reduce outdoor exertion.",
      severity: 34 + ((aqi - 100) / 50) * 17,
    };
  }
  if (aqi <= 200) {
    return {
      label: "Unhealthy",
      textClass: "text-red-700 dark:text-red-300",
      bgClass: "bg-red-100 dark:bg-red-950/50",
      borderClass: "border-red-300/70 dark:border-red-800/60",
      hex: "#ef4444",
      advice: "Everyone may begin to experience health effects. Limit outdoor activity.",
      severity: 51 + ((aqi - 150) / 50) * 17,
    };
  }
  if (aqi <= 300) {
    return {
      label: "Very Unhealthy",
      textClass: "text-purple-700 dark:text-purple-300",
      bgClass: "bg-purple-100 dark:bg-purple-950/50",
      borderClass: "border-purple-300/70 dark:border-purple-800/60",
      hex: "#a855f7",
      advice: "Health alert: avoid prolonged outdoor exertion.",
      severity: 68 + ((aqi - 200) / 100) * 17,
    };
  }
  return {
    label: "Hazardous",
    textClass: "text-rose-900 dark:text-rose-200",
    bgClass: "bg-rose-200 dark:bg-rose-950/70",
    borderClass: "border-rose-400/70 dark:border-rose-700/70",
    hex: "#9f1239",
    advice: "Emergency conditions. Everyone should avoid outdoor activity.",
    severity: 85 + Math.min(((aqi - 300) / 200) * 15, 15),
  };
}

export interface AqiBreakdown {
  pm2_5?: number;
  pm10?: number;
  ozone?: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
}
