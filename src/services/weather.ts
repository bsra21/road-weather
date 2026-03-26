import { RoutePoint, RouteTiming, WeatherAtPoint } from "../types.js";

type OpenMeteoHourly = {
  time?: string[];
  temperature_2m?: number[];
  precipitation?: number[];
  wind_speed_10m?: number[];
};

function parseUtcTime(raw: string): number {
  return raw.endsWith("Z") ? Date.parse(raw) : Date.parse(`${raw}Z`);
}

function findClosestHourIndex(times: string[], targetEpochMs: number): number {
  let bestIdx = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < times.length; i += 1) {
    const epochMs = parseUtcTime(times[i]);
    if (Number.isNaN(epochMs)) {
      continue;
    }

    const diff = Math.abs(epochMs - targetEpochMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  return bestIdx;
}

export async function getWeatherForPoint(
  point: RoutePoint,
  timing: RouteTiming
): Promise<WeatherAtPoint> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lon));
  url.searchParams.set("hourly", "temperature_2m,precipitation,wind_speed_10m");
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "UTC");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather request failed: ${res.status}`);
  }

  const data = (await res.json()) as { hourly?: OpenMeteoHourly };
  const hourly = data.hourly;

  const etaHours = point.kmFromStart / timing.averageSpeedKmh;
  const targetEpochMs = Date.parse(timing.departureTimeUtc) + etaHours * 3600 * 1000;
  const expectedAtUtc = new Date(targetEpochMs).toISOString();

  const times = hourly?.time ?? [];
  const idx = times.length ? findClosestHourIndex(times, targetEpochMs) : 0;

  return {
    point,
    etaHours: Number(etaHours.toFixed(2)),
    expectedAtUtc,
    forecastTimeUtc: times[idx] ? new Date(parseUtcTime(times[idx])).toISOString() : null,
    temperatureC: hourly?.temperature_2m?.[idx] ?? null,
    precipitationMm: hourly?.precipitation?.[idx] ?? null,
    windSpeedKmh: hourly?.wind_speed_10m?.[idx] ?? null
  };
}

export async function getWeatherForRoute(
  points: RoutePoint[],
  timing: RouteTiming
): Promise<WeatherAtPoint[]> {
  return Promise.all(points.map((point) => getWeatherForPoint(point, timing)));
}
