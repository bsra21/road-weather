import { WeatherAtPoint } from "../types.js";

export type PointRisk = "low" | "medium" | "high";

export type PointRiskResult = {
  risk: PointRisk;
  reasons: string[];
};

export type RouteRiskSummary = {
  overallRisk: PointRisk;
  riskyPointCount: number;
  firstRiskyPointKm: number | null;
};

export function evaluatePointRisk(point: WeatherAtPoint): PointRiskResult {
  const reasons: string[] = [];
  let score = 0;

  const precipitation = point.precipitationMm ?? 0;
  const wind = point.windSpeedKmh ?? 0;
  const temp = point.temperatureC;

  if (precipitation >= 2) {
    score += 2;
    reasons.push("Yoğun yağış");
  } else if (precipitation > 0) {
    score += 1;
    reasons.push("Hafif yağış");
  }

  if (wind >= 45) {
    score += 2;
    reasons.push("Kuvvetli rüzgar");
  } else if (wind >= 25) {
    score += 1;
    reasons.push("Orta rüzgar");
  }

  if (temp !== null && temp <= 2) {
    score += 1;
    reasons.push("Düşük sıcaklık / buzlanma riski");
  }

  const risk: PointRisk = score >= 3 ? "high" : score >= 1 ? "medium" : "low";
  return { risk, reasons };
}

export function summarizeRouteRisk(points: Array<WeatherAtPoint & PointRiskResult>): RouteRiskSummary {
  const risky = points.filter((p) => p.risk !== "low");
  const overallRisk: PointRisk = points.some((p) => p.risk === "high")
    ? "high"
    : points.some((p) => p.risk === "medium")
      ? "medium"
      : "low";

  return {
    overallRisk,
    riskyPointCount: risky.length,
    firstRiskyPointKm: risky.length ? risky[0].point.kmFromStart : null
  };
}
