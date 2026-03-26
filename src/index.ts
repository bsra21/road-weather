import express from "express";
import { geocodePlace } from "./services/geocoding.js";
import { buildRideAdvice, buildRiskSegments } from "./services/insights.js";
import { evaluatePointRisk, summarizeRouteRisk } from "./services/risk.js";
import { getRouteCoordinates, sampleRouteByDistance } from "./services/routing.js";
import { getWeatherForRoute } from "./services/weather.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/route-weather", async (req, res) => {
  try {
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();
    const departureTimeUtc =
      String(req.query.departureTimeUtc ?? "").trim() || new Date().toISOString();
    const averageSpeedKmh = Number(req.query.averageSpeedKmh ?? 75);

    if (!from || !to) {
      return res.status(400).json({ error: "from and to query params are required" });
    }

    if (!Number.isFinite(averageSpeedKmh) || averageSpeedKmh <= 0) {
      return res.status(400).json({ error: "averageSpeedKmh must be a positive number" });
    }

    const departureMs = Date.parse(departureTimeUtc);
    if (Number.isNaN(departureMs)) {
      return res.status(400).json({ error: "departureTimeUtc must be a valid ISO datetime" });
    }

    const [fromCoords, toCoords] = await Promise.all([geocodePlace(from), geocodePlace(to)]);
    const route = await getRouteCoordinates(fromCoords, toCoords);
    const sampledPoints = sampleRouteByDistance(route, 50);
    const weather = await getWeatherForRoute(sampledPoints, {
      departureTimeUtc: new Date(departureMs).toISOString(),
      averageSpeedKmh
    });

    const pointsWithRisk = weather.map((point) => ({
      ...point,
      ...evaluatePointRisk(point)
    }));

    const routeRisk = summarizeRouteRisk(pointsWithRisk);
    const segments = buildRiskSegments(pointsWithRisk);
    const advice = buildRideAdvice(routeRisk.overallRisk);

    return res.json({
      from: { query: from, ...fromCoords },
      to: { query: to, ...toCoords },
      sampleStepKm: 50,
      departureTimeUtc: new Date(departureMs).toISOString(),
      averageSpeedKmh,
      routeRisk,
      segments,
      advice,
      points: pointsWithRisk
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Road Weather API listening on http://localhost:${port}`);
});
