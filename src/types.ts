export type LatLng = {
  lat: number;
  lon: number;
};

export type RoutePoint = LatLng & {
  kmFromStart: number;
};

export type RouteTiming = {
  departureTimeUtc: string;
  averageSpeedKmh: number;
};

export type WeatherAtPoint = {
  point: RoutePoint;
  etaHours: number;
  expectedAtUtc: string;
  forecastTimeUtc: string | null;
  temperatureC: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
};
