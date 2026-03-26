import { LatLng, RoutePoint } from "../types.js";
import { haversineKm } from "../utils/geo.js";

export async function getRouteCoordinates(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}`
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Routing request failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    routes?: Array<{ geometry: { coordinates: [number, number][] } }>;
  };

  const coordinates = data.routes?.[0]?.geometry?.coordinates;
  if (!coordinates?.length) {
    throw new Error("No route returned from OSRM");
  }

  return coordinates.map(([lon, lat]) => ({ lat, lon }));
}

export function sampleRouteByDistance(route: LatLng[], stepKm = 50): RoutePoint[] {
  if (route.length < 2) {
    return [];
  }

  const points: RoutePoint[] = [{ ...route[0], kmFromStart: 0 }];
  let carriedKm = 0;
  let nextMarkKm = stepKm;

  for (let i = 1; i < route.length; i += 1) {
    const segmentKm = haversineKm(route[i - 1], route[i]);
    carriedKm += segmentKm;

    if (carriedKm >= nextMarkKm) {
      points.push({ ...route[i], kmFromStart: Number(carriedKm.toFixed(1)) });
      nextMarkKm += stepKm;
    }
  }

  points.push({ ...route[route.length - 1], kmFromStart: Number(carriedKm.toFixed(1)) });
  return points;
}
