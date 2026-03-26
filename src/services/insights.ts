import { PointRiskResult } from "./risk.js";

type PointWithKmAndRisk = {
  point: { kmFromStart: number };
  risk: PointRiskResult["risk"];
  reasons: string[];
};

export type RiskSegment = {
  startKm: number;
  endKm: number;
  risk: PointRiskResult["risk"];
  reasons: string[];
};

export type RideAdvice = {
  message: string;
  tips: string[];
};

export function buildRiskSegments(points: PointWithKmAndRisk[]): RiskSegment[] {
  if (points.length === 0) {
    return [];
  }

  const segments: RiskSegment[] = [];
  let current: RiskSegment = {
    startKm: points[0].point.kmFromStart,
    endKm: points[0].point.kmFromStart,
    risk: points[0].risk,
    reasons: [...points[0].reasons]
  };

  for (let i = 1; i < points.length; i += 1) {
    const p = points[i];
    if (p.risk === current.risk) {
      current.endKm = p.point.kmFromStart;
      current.reasons = Array.from(new Set([...current.reasons, ...p.reasons]));
      continue;
    }

    segments.push(current);
    current = {
      startKm: points[i - 1].point.kmFromStart,
      endKm: p.point.kmFromStart,
      risk: p.risk,
      reasons: [...p.reasons]
    };
  }

  segments.push(current);
  return segments;
}

export function buildRideAdvice(overallRisk: PointRiskResult["risk"]): RideAdvice {
  if (overallRisk === "high") {
    return {
      message: "Yüksek risk: Yolculuğu ertelemen veya saat değiştirmen önerilir.",
      tips: [
        "Yağmurluk ve reflektif ekipman şart.",
        "Rüzgarın yüksek olduğu açık alanlarda hızını düşür.",
        "Mümkünse daha geç çıkıp riskli segmentleri atlat."
      ]
    };
  }

  if (overallRisk === "medium") {
    return {
      message: "Orta risk: Yol mümkün, ama dikkatli sürüş ve ekipman gerekli.",
      tips: [
        "Hava değişimi için katmanlı giyin.",
        "Islak zeminde takip mesafesini artır.",
        "Rota üstündeki riskli kilometreleri önceden not et."
      ]
    };
  }

  return {
    message: "Düşük risk: Mevcut veriye göre rota genel olarak uygun görünüyor.",
    tips: [
      "Standart koruyucu ekipmanı ihmal etme.",
      "Her 150-200 km'de kısa mola planla.",
      "Yola çıkmadan 30 dk önce tahmini tekrar kontrol et."
    ]
  };
}
