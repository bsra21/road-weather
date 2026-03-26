import { LatLng } from "../types.js";

const USER_AGENT = "road-weather-mvp/0.1";

export async function geocodePlace(query: string): Promise<LatLng> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT
    }
  });

  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status}`);
  }

  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) {
    throw new Error(`Location not found: ${query}`);
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon)
  };
}
