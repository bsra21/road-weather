# Road Weather — Sıfırdan Başlangıç Rehberi (Day 1)

Bu rehber, **GitHub'da sadece README olan boş bir repo**dan başlayıp çalışan bir Day 1 backend prototipi çıkarman için yazıldı.

## 1) Hangi dili seçelim?

**Öneri: TypeScript + Node.js (Express)**

Neden?
- Hızlı MVP geliştirirsin.
- Tip güvenliği sayesinde hata azaltırsın.
- İleride React/Next.js frontend ile aynı dili kullanırsın.

---

## 2) Bilgisayarında gereken kurulumlar

- **Git**
- **Node.js 20+** (LTS önerilir)

Kontrol et:

```bash
git --version
node -v
npm -v
```

---

## 3) GitHub'daki boş repoyu lokale çek

Aşağıdaki komutlarda kendi repo URL'ni kullan:

```bash
git clone https://github.com/<kullanici-adi>/<repo-adi>.git
cd <repo-adi>
```

---

## 4) Projeyi başlat (package.json + TypeScript ayarları)

```bash
npm init -y
npm pkg set type=module
npm pkg set scripts.dev="tsx src/index.ts"
npm pkg set scripts.build="tsc -p tsconfig.json"
npm pkg set scripts.start="node dist/index.js"
npm pkg set scripts.check="tsc --noEmit"
```

Bağımlılıklar:

```bash
npm i express
npm i -D typescript tsx @types/node @types/express
```

TypeScript config oluştur:

```bash
npx tsc --init
```

`tsconfig.json` dosyasını aşağıdaki gibi güncelle:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

---

## 5) Klasör yapısını oluştur

```bash
mkdir -p src/services src/utils
```

Dosyalar:

```text
src/
  index.ts
  types.ts
  services/
    geocoding.ts
    routing.ts
    weather.ts
  utils/
    geo.ts
```

---

## 6) Day 1 iş akışı (API data çekimleri)

`GET /api/route-weather?from=izmir&to=ankara&departureTimeUtc=2026-03-26T08:00:00Z&averageSpeedKmh=80`

Bu endpoint şu sırayla çalışır:

1. **Geocoding:** `from/to` metnini koordinata çevir (Nominatim)
2. **Routing:** koordinatlarla rotayı al (OSRM)
3. **Sampling:** rotadan her 50 km'de bir nokta çıkar
4. **ETA:** ortalama hıza göre her noktaya varış saatini hesapla
5. **Weather:** her nokta için varış saatine en yakın forecast saatini al (Open-Meteo)
6. Hepsini tek JSON response olarak döndür


---

## 7) Çalıştır

```bash
npm run dev
```

Test:

```bash
curl "http://localhost:3000/health"
curl "http://localhost:3000/api/route-weather?from=izmir&to=ankara&departureTimeUtc=2026-03-26T08:00:00Z&averageSpeedKmh=80"
```

---

## 8) GitHub'a ilk gerçek commit

```bash
git add .
git commit -m "feat: bootstrap day-1 road weather backend"
git push origin main
```

---

## 9) Sıradaki adım (Day 2)

- Tahmini yolculuk süresine göre **doğru saatteki** hava tahminini eşleştir
- Risk skoru üret (yağış/rüzgar eşikleri)
- Harita üzerinde segmentleri (yeşil/sarı/kırmızı) görselleştir

---

## Sık yapılan hata (önemli)

- Sadece API'den gelen ilk saat verisini kullanmak (yanlış olabilir).
- Doğrusu: rotadaki noktaya **varış zamanı** hesaplayıp o saate denk gelen forecast'i almak.


---


## 10) Beklenen yeni response alanları

Aşağıdaki alanları görüyorsan doğru (güncel) kod çalışıyor demektir:

- `departureTimeUtc`
- `averageSpeedKmh`
- `routeRisk.overallRisk`
- `points[].etaHours`
- `points[].expectedAtUtc`
- `points[].forecastTimeUtc`
- `points[].risk` ve `points[].reasons`

- `segments[]`: rota risk segmentleri (`startKm`, `endKm`, `risk`)
- `advice`: genel sürüş önerisi ve ekipman ipuçları

Eğer bunlar yoksa, eski dosyalar çalışıyordur; `src/index.ts` ve `src/services/weather.ts` dosyalarını tekrar kontrol et.

