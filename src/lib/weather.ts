import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Cloudy,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

export interface WeatherInfo {
  label: string;
  icon: LucideIcon;
  /** Whether this code represents any kind of rain / drizzle / showers / freezing rain. */
  isRaining: boolean;
  /** True for snow, snow grains, snow showers. */
  isSnowing: boolean;
  /** True for thunderstorms. */
  isStorm: boolean;
}

/**
 * Maps WMO weather interpretation codes used by Open-Meteo.
 * Reference: https://open-meteo.com/en/docs (weather_code)
 */
const CODE_MAP: Record<number, WeatherInfo> = {
  0: { label: "Clear sky", icon: Sun, isRaining: false, isSnowing: false, isStorm: false },
  1: { label: "Mainly clear", icon: Sun, isRaining: false, isSnowing: false, isStorm: false },
  2: { label: "Partly cloudy", icon: Cloudy, isRaining: false, isSnowing: false, isStorm: false },
  3: { label: "Overcast", icon: Cloudy, isRaining: false, isSnowing: false, isStorm: false },
  45: { label: "Fog", icon: CloudFog, isRaining: false, isSnowing: false, isStorm: false },
  48: { label: "Depositing rime fog", icon: CloudFog, isRaining: false, isSnowing: false, isStorm: false },
  51: { label: "Light drizzle", icon: CloudDrizzle, isRaining: true, isSnowing: false, isStorm: false },
  53: { label: "Moderate drizzle", icon: CloudDrizzle, isRaining: true, isSnowing: false, isStorm: false },
  55: { label: "Dense drizzle", icon: CloudDrizzle, isRaining: true, isSnowing: false, isStorm: false },
  56: { label: "Light freezing drizzle", icon: CloudDrizzle, isRaining: true, isSnowing: false, isStorm: false },
  57: { label: "Dense freezing drizzle", icon: CloudDrizzle, isRaining: true, isSnowing: false, isStorm: false },
  61: { label: "Slight rain", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  63: { label: "Moderate rain", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  65: { label: "Heavy rain", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  66: { label: "Light freezing rain", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  67: { label: "Heavy freezing rain", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  71: { label: "Slight snow fall", icon: CloudSnow, isRaining: false, isSnowing: true, isStorm: false },
  73: { label: "Moderate snow fall", icon: CloudSnow, isRaining: false, isSnowing: true, isStorm: false },
  75: { label: "Heavy snow fall", icon: CloudSnow, isRaining: false, isSnowing: true, isStorm: false },
  77: { label: "Snow grains", icon: CloudSnow, isRaining: false, isSnowing: true, isStorm: false },
  80: { label: "Slight rain showers", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  81: { label: "Moderate rain showers", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  82: { label: "Violent rain showers", icon: CloudRain, isRaining: true, isSnowing: false, isStorm: false },
  85: { label: "Slight snow showers", icon: CloudSnow, isRaining: false, isSnowing: true, isStorm: false },
  86: { label: "Heavy snow showers", icon: CloudSnow, isRaining: false, isSnowing: true, isStorm: false },
  95: { label: "Thunderstorm", icon: CloudLightning, isRaining: true, isSnowing: false, isStorm: true },
  96: { label: "Thunderstorm with slight hail", icon: CloudLightning, isRaining: true, isSnowing: false, isStorm: true },
  99: { label: "Thunderstorm with heavy hail", icon: CloudLightning, isRaining: true, isSnowing: false, isStorm: true },
};

const NIGHT_OVERRIDES: Partial<Record<number, LucideIcon>> = {
  0: Moon,
  1: Moon,
};

export function getWeatherInfo(code: number, isDay = 1): WeatherInfo {
  const base = CODE_MAP[code] ?? {
    label: "Unknown",
    icon: Cloud,
    isRaining: false,
    isSnowing: false,
    isStorm: false,
  };

  if (isDay === 0 && NIGHT_OVERRIDES[code]) {
    return { ...base, icon: NIGHT_OVERRIDES[code]! };
  }
  return base;
}
