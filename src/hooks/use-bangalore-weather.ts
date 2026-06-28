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

export interface CurrentAqi {
  usAqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
}

export interface HourlyForecastPoint {
  /** ISO timestamp from the API */
  time: string;
  /** Hour of day in local time, e.g. "14:00" */
  hourLabel: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  isDay: boolean;
}

export interface WeatherState {
  data: CurrentWeather | null;
  aqi: CurrentAqi | null;
  hourly: HourlyForecastPoint[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
}

const REFETCH_MS = 60 * 1000; // 1 minute

export function useWeather(lat: number, lon: number): WeatherState {
  const [data, setData] = useState<CurrentWeather | null>(null);
  const [aqi, setAqi] = useState<CurrentAqi | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    // No synchronous setState here — all setState calls are after `await`,
    // so they don't trigger the set-state-in-effect lint rule when fetchData
    // is called from a useEffect. The initial `loading` state is already `true`.
    try {
      const res = await fetch(
        `/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        { cache: "default" },
      );
      if (!res.ok) {
        throw new Error(`Request failed with ${res.status}`);
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }

      const c = json?.weather?.current;
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

      const a = json?.aqi?.current;
      setAqi(
        a
          ? {
              usAqi: a.us_aqi ?? null,
              pm2_5: a.pm2_5 ?? null,
              pm10: a.pm10 ?? null,
              ozone: a.ozone ?? null,
              nitrogen_dioxide: a.nitrogen_dioxide ?? null,
              sulphur_dioxide: a.sulphur_dioxide ?? null,
            }
          : null,
      );

      // Parse hourly forecast: take next 8 hours starting from the current hour.
      const h = json?.weather?.hourly;
      if (h && Array.isArray(h.time) && Array.isArray(h.temperature_2m)) {
        // Open-Meteo returns hourly times as LOCAL time strings like
        // "2024-01-01T23:00" (no timezone suffix) when timezone=auto.
        // The response also includes utc_offset_seconds which we use to compute
        // the current local time for comparison.
        const utcOffsetSec: number = json?.weather?.utc_offset_seconds ?? 0;
        const nowUtcMs = Date.now();
        const localNowMs = nowUtcMs + utcOffsetSec * 1000;
        // Build a local-time ISO string "YYYY-MM-DDTHH" for the current hour
        const localNow = new Date(localNowMs);
        const localHourBucket =
          localNow.getUTCFullYear() +
          "-" +
          String(localNow.getUTCMonth() + 1).padStart(2, "0") +
          "-" +
          String(localNow.getUTCDate()).padStart(2, "0") +
          "T" +
          String(localNow.getUTCHours()).padStart(2, "0");

        // Find the first hourly bucket >= current local hour.
        // This ensures we include the current hour (e.g. at 10:43pm, the 22:00
        // bucket is shown as "Now") rather than skipping ahead.
        let startIdx = h.time.findIndex((t: string) => {
          return String(t).slice(0, 13) >= localHourBucket;
        });
        if (startIdx === -1) {
          // All hours are in the past — fall back to the last bucket
          startIdx = Math.max(0, h.time.length - 8);
        }

        const points: HourlyForecastPoint[] = [];
        for (let i = startIdx; i < Math.min(startIdx + 8, h.time.length); i++) {
          const time = h.time[i] as string;
          // Parse the local-time string manually to avoid timezone misinterpretation.
          // Format: "2024-01-01T23:00"
          const timePart = time.split("T")[1];
          const hour = Number(timePart.slice(0, 2));
          // sunrise/sunset approximation: 6:00–18:00 = day
          const isDay = hour >= 6 && hour < 18;
          const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const ampm = hour < 12 ? "AM" : "PM";
          const hourLabel = `${hour12} ${ampm}`;
          points.push({
            time,
            hourLabel,
            temperature: h.temperature_2m[i],
            weatherCode: h.weather_code[i],
            precipitationProbability: h.precipitation_probability?.[i] ?? 0,
            isDay,
          });
        }
        setHourly(points);
      } else {
        setHourly([]);
      }

      setLastUpdated(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  // refresh is called from a button onClick (event handler, not effect),
  // so setLoading(true) here is safe.
  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // fetchData's first call: loading is already `true` from useState init,
    // so no synchronous setState happens in this effect body.
    fetchData();
    const id = setInterval(() => {
      // setInterval callback runs asynchronously — not in the effect body.
      setLoading(true);
      fetchData();
    }, REFETCH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return { data, aqi, hourly, loading, error, lastUpdated, refresh };
}
