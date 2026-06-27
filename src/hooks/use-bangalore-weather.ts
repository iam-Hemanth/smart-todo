"use client";

import { useEffect, useState, useCallback } from "react";

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  isDay: boolean;
  weatherCode: number;
}

export interface WeatherState {
  data: CurrentWeather | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
}

const REFETCH_MS = 10 * 60 * 1000; // 10 minutes

export function useBangaloreWeather(): WeatherState {
  const [data, setData] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weather", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      const c = json?.current;
      if (!c) {
        throw new Error("Unexpected payload from weather API");
      }
      setData({
        temperature: c.temperature_2m,
        apparentTemperature: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        precipitation: c.precipitation,
        isDay: c.is_day === 1,
        weatherCode: c.weather_code,
      });
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFETCH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refresh: fetchData };
}
