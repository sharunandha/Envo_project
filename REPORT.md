# India Flood & Landslide Early Warning System — Detailed Technical Report

> **Project:** Envo_project  
> **Repository:** [github.com/sharunandha/Envo_project](https://github.com/sharunandha/Envo_project)  
> **Live Frontend:** [frontend-production-35ae.up.railway.app](https://frontend-production-35ae.up.railway.app)  
> **Live Backend API:** [envo-project-production.up.railway.app](https://envo-project-production.up.railway.app)  
> **Date:** February 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Sources & Live APIs](#4-data-sources--live-apis)
5. [Dam Database](#5-dam-database)
6. [Risk Scoring — Formulas & Calculations](#6-risk-scoring--formulas--calculations)
7. [Reservoir Level Estimation](#7-reservoir-level-estimation)
8. [Alert Generation Logic](#8-alert-generation-logic)
9. [24-Hour Prediction Model](#9-24-hour-prediction-model)
10. [Risk Trend Chart (±24h) — Past Estimation](#10-risk-trend-chart-24h--past-estimation)
11. [Caching Strategy](#11-caching-strategy)
12. [Frontend Implementation](#12-frontend-implementation)
13. [API Endpoints Reference](#13-api-endpoints-reference)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Performance & Scalability](#15-performance--scalability)
16. [File Structure](#16-file-structure)
17. [How It All Works End-to-End](#17-how-it-all-works-end-to-end)

---

## 1. Executive Summary

This system is a **real-time flood and landslide early warning platform** for India, monitoring **61 major dams** across **24 states**. Every data point displayed is sourced from **live, free, public APIs** — there are **zero mock values, zero random numbers, and zero hardcoded data**.

The system:
- Fetches live weather forecasts, soil moisture, river discharge, satellite precipitation, and earthquake data
- Computes **flood risk scores (0–100)** using a weighted 5-factor formula
- Computes **landslide risk scores (0–100)** using a weighted 5-factor formula
- Estimates **reservoir levels** from seasonal baselines adjusted by live environmental data
- Generates **alerts** (HIGH / MEDIUM / INFO severity) based on computed scores
- Predicts **24-hour future risk** using deterministic trend extrapolation
- Displays everything on an interactive dashboard with maps, charts, and analytics

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
│  Dashboard │ Map (Leaflet) │ Charts (Chart.js) │ Alerts Panel  │
│                                                                 │
│  axios ──► REACT_APP_API_URL ──► Backend /api/*                │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                     BACKEND (Node.js / Express)                 │
│                                                                 │
│  server.js ──► Routes ──► Controllers ──► Services              │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ dataRoutes │  │ riskRoutes   │  │ riskAnalysisService     │ │
│  │            │  │              │  │  • calculateFloodRisk() │ │
│  │ /rainfall  │  │ /calculate   │  │  • calculateLandslide() │ │
│  │ /earthquakes│  │ /all        │  │  • generateAlerts()     │ │
│  │ /reservoirs│  │ /alerts      │  │  • predictRisk24Hours() │ │
│  │ /soil      │  │              │  └─────────────────────────┘ │
│  │ /discharge │  │              │                               │
│  │ /dams      │  │              │  ┌─────────────────────────┐ │
│  │ /all       │  │              │  │ apiService              │ │
│  └────────────┘  └──────────────┘  │  • fetchRainfallForecast│ │
│                                     │  • fetchHistoricalRain  │ │
│  ┌────────────────────────────┐    │  • fetchSoilMoisture    │ │
│  │ Cache (in-memory, 10 min) │    │  • fetchRiverDischarge  │ │
│  └────────────────────────────┘    │  • fetchNASAPrecip      │ │
│                                     │  • fetchEarthquakeData  │ │
│  ┌────────────────────────────┐    │  • fetchReservoirLevels │ │
│  │ damLocations.js (61 dams) │    └─────────────────────────┘ │
│  └────────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
          │            │            │            │           │
          ▼            ▼            ▼            ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐
   │Open-Meteo│ │Open-Meteo│ │Open-Meteo│ │  NASA  │ │  USGS  │
   │ Forecast │ │Land-Surf.│ │  GloFAS  │ │ POWER  │ │  FDSN  │
   │  API     │ │  Model   │ │Flood API │ │Satellit│ │Earthqua│
   └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘
```

**Pattern:** MVC (Model-View-Controller)  
**Data Flow:** Frontend → Backend API → Live External APIs → Risk Engine → Response

---

## 3. Technology Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | ≥ 18.0 |
| Framework | Express.js | 4.18.2 |
| HTTP Client | Axios | 1.6.2 |
| CORS | cors | 2.8.5 |
| Rate Limiting | express-rate-limit | 7.1.5 |
| Environment | dotenv | 16.3.1 |
| Dev Server | nodemon | 3.0.2 |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.2.0 |
| Build Tool | Create React App | 5.0.1 |
| HTTP Client | Axios | 1.6.2 |
| Charts | Chart.js + react-chartjs-2 | 4.4.0 / 5.2.0 |
| Maps | Leaflet + react-leaflet | 1.9.4 / 4.2.1 |
| CSS | Tailwind CSS | 3.3.6 |
| PDF Export | html2pdf.js | 0.10.1 |

### Deployment
| Component | Platform |
|-----------|----------|
| Backend | Railway (Docker container) |
| Frontend | Railway (Docker container + serve) |
| Source Control | GitHub |
| Containerization | Docker (node:18-alpine) |

---

## 4. Data Sources & Live APIs

Every number in the system comes from one of these 6 live API sources. **No mock data, no random values.**

### 4.1 Open-Meteo Weather Forecast API
- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Data:** Daily precipitation sum, rain sum, precipitation probability, temperature (max/min), wind speed, hourly precipitation, humidity, surface soil moisture
- **Range:** 7-day forecast
- **Timezone:** `Asia/Kolkata`
- **Parameters:**
  ```
  daily: precipitation_sum, rain_sum, precipitation_probability_max,
         temperature_2m_max, temperature_2m_min, windspeed_10m_max
  hourly: precipitation, precipitation_probability, relative_humidity_2m,
          soil_moisture_0_to_1cm
  ```

### 4.2 Open-Meteo Historical Weather API
- **URL:** `https://api.open-meteo.com/v1/forecast` (with `start_date` / `end_date`)
- **Data:** Past 7-day daily precipitation accumulation
- **Used for:** Cumulative rainfall calculation, reservoir trend analysis

### 4.3 Open-Meteo Land-Surface Model (Soil Moisture)
- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Data:** Volumetric soil moisture at 5 depth layers (m³/m³)
- **Variables:**
  ```
  soil_moisture_0_to_1cm      ← Surface layer
  soil_moisture_1_to_3cm      ← Surface layer
  soil_moisture_3_to_9cm      ← Mid-depth
  soil_moisture_9_to_27cm     ← Mid-depth
  soil_moisture_27_to_81cm    ← Deep layer
  soil_temperature_0cm        ← Surface temperature
  ```
- **Processing:**
  - **Surface moisture** = average of 0–1 cm and 1–3 cm layers
  - **Mid-depth moisture** = average of 3–9 cm and 9–27 cm layers
  - **Deep moisture** = 27–81 cm layer directly
  - Latest non-null value is used (forecast hours may be null)

### 4.4 Open-Meteo GloFAS Flood API (River Discharge)
- **URL:** `https://flood-api.open-meteo.com/v1/flood`
- **Data:** Daily river discharge forecast (m³/s) for 7 days
- **Statistics computed:** Max discharge, average discharge, latest discharge
- **GloFAS** = Global Flood Awareness System (Copernicus)

### 4.5 NASA POWER Satellite Precipitation
- **URL:** `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Parameter:** `PRECTOTCORR` (Precipitation Corrected, mm/day)
- **Range:** Last 14 days
- **Community:** `RE` (Renewable Energy — provides global precipitation)
- **Processing:** Values of `-999` (missing) are treated as 0; daily stats computed

### 4.6 USGS Earthquake Hazards Program (FDSN)
- **URL:** `https://earthquake.usgs.gov/fdsnws/event/1/query`
- **Data:** Earthquake events ≥ M2.5 within 300 km radius, last 30 days
- **Format:** GeoJSON
- **Fields extracted:** Magnitude, depth, place name, time, coordinates
- **Distance calculation:** Haversine formula from dam location to earthquake epicenter

#### Haversine Distance Formula
```
d = 2R × arctan2(√a, √(1−a))
where:
  a = sin²(Δlat/2) + cos(lat₁) × cos(lat₂) × sin²(Δlon/2)
  R = 6371 km (Earth's radius)
  Δlat = lat₂ − lat₁  (in radians)
  Δlon = lon₂ − lon₁  (in radians)
```

---

## 5. Dam Database

The system monitors **61 dams** across **24 Indian states**, stored in `backend/utils/damLocations.js`.

### Coverage by State
| State | Dams | Example Dams |
|-------|------|-------------|
| Gujarat | 4 | Sardar Sarovar, Ukai, Kadana, Dharoi |
| Himachal Pradesh | 3 | Bhakra Nangal, Pong, Pandoh |
| Uttarakhand | 2 | Tehri, Koteshwar |
| Punjab | 1 | Ranjit Sagar (Thein) |
| Rajasthan | 4 | Rana Pratap Sagar, Bisalpur, Jawahar Sagar, Mahi Bajaj Sagar |
| Madhya Pradesh | 5 | Indira Sagar, Gandhi Sagar, Tawa, Bargi, Ban Sagar |
| Maharashtra | 5 | Koyna, Jayakwadi, Ujani, Bhatsa, Irai |
| Karnataka | 5 | KRS, Tungabhadra, Almatti, Linganamakki, Kabini |
| Tamil Nadu | 4 | Mettur, Vaigai, Bhavanisagar, Amaravathi |
| Kerala | 4 | Idukki, Mullaperiyar, Banasura Sagar, Kakki |
| Andhra Pradesh | 3 | Nagarjuna Sagar, Srisailam, Somasila |
| Telangana | 2 | Sriramsagar, Singur |
| Odisha | 3 | Hirakud, Rengali, Upper Indravati |
| Jharkhand | 3 | Maithon, Panchet, Tenughat |
| West Bengal | 1 | Massanjore |
| Chhattisgarh | 2 | Gangrel, Minimata (Bango) |
| Goa | 1 | Selaulim |
| Jammu & Kashmir | 2 | Baglihar, Salal |
| Meghalaya | 1 | Umiam |
| Nagaland | 1 | Doyang |
| Arunachal Pradesh | 1 | Ranganadi |
| Assam | 1 | Kopili |
| Manipur | 1 | Mapithel |
| Uttar Pradesh | 2 | Rihand, Matatila |

Each dam entry contains:
```javascript
{
  id: 'sardar-sarovar',        // Unique identifier
  name: 'Sardar Sarovar',      // Display name
  latitude: 21.830,            // GPS latitude
  longitude: 73.748,           // GPS longitude
  state: 'Gujarat',            // Indian state
  capacity: 163,               // TMC (Thousand Million Cubic feet)
  river: 'Narmada'             // River name
}
```

### Landslide-Prone Zones
5 geological zones mapped to states for regional susceptibility scoring:

| Zone | States | Risk Level |
|------|--------|-----------|
| Western Ghats | Kerala, Tamil Nadu, Karnataka, Maharashtra, Goa | **HIGH** |
| Himalayas | Himachal Pradesh, Uttarakhand, Jammu & Kashmir | **HIGH** |
| Northeast Hills | Assam, Meghalaya, Mizoram, Nagaland, Manipur, Arunachal Pradesh, Tripura, Sikkim | **MEDIUM** |
| Eastern Ghats | Odisha, Andhra Pradesh, Telangana | **MEDIUM** |
| Vindhya-Satpura | Madhya Pradesh, Chhattisgarh, Jharkhand | **LOW** |

---

## 6. Risk Scoring — Formulas & Calculations

All risk scores are **deterministic** (same inputs → same output). No random values are used anywhere.

### 6.1 Flood Risk Score (0–100)

Five weighted factors are summed:

| # | Factor | Max Points | Source |
|---|--------|-----------|--------|
| 1 | Reservoir / Water Level | 25 | Derived (see §7) |
| 2 | Forecast Rainfall (7-day max) | 25 | Open-Meteo Forecast |
| 3 | Historical Rainfall (7-day sum) | 20 | Open-Meteo Historical |
| 4 | River Discharge | 20 | GloFAS |
| 5 | Rainfall Trend | 10 | Computed from recent precipitation |

**Total possible: 100 points** (capped at 100)

#### Factor 1: Reservoir Level (0–25 points)
```
if reservoirLevel > 85%  → +25 pts  ("Critical reservoir level")
if reservoirLevel > 75%  → +18 pts  ("High reservoir level")
if reservoirLevel > 60%  → +12 pts  ("Elevated reservoir level")
if reservoirLevel > 45%  → +6  pts  ("Moderate reservoir level")
otherwise                → +0  pts
```

#### Factor 2: Forecast Rainfall — Daily Maximum (0–25 points)
```
if forecastRainfall > 100 mm  → +25 pts  ("Extreme rainfall forecast")
if forecastRainfall > 60  mm  → +20 pts  ("Very heavy rainfall forecast")
if forecastRainfall > 35  mm  → +14 pts  ("Heavy rainfall forecast")
if forecastRainfall > 15  mm  → +7  pts  ("Moderate rainfall forecast")
otherwise                     → +0  pts
```

#### Factor 3: Historical 7-Day Rainfall Accumulation (0–20 points)
```
if historicalRainfall > 200 mm  → +20 pts  ("Extreme cumulative rain")
if historicalRainfall > 120 mm  → +15 pts  ("Very high cumulative rain")
if historicalRainfall > 60  mm  → +10 pts  ("High cumulative rain")
if historicalRainfall > 25  mm  → +5  pts  ("Moderate cumulative rain")
otherwise                       → +0  pts
```

#### Factor 4: River Discharge (0–20 points)
```
if riverDischarge > 5000 m³/s  → +20 pts  ("Very high river discharge")
if riverDischarge > 2000 m³/s  → +15 pts  ("High river discharge")
if riverDischarge > 500  m³/s  → +10 pts  ("Elevated river discharge")
if riverDischarge > 100  m³/s  → +5  pts  ("Moderate river discharge")
otherwise                      → +0  pts
```

#### Factor 5: Rainfall Trend (0–10 points)
```
if trend == 'increasing'  → +10 pts
if trend == 'stable'      → +3  pts
if trend == 'decreasing'  → +0  pts
```

#### Final Classification
```
Score ≥ 70  →  HIGH risk
Score ≥ 40  →  MEDIUM risk
Score < 40  →  LOW risk
```

---

### 6.2 Landslide Risk Score (0–100)

Five weighted factors are summed:

| # | Factor | Max Points | Source |
|---|--------|-----------|--------|
| 1 | Soil Moisture (surface, m³/m³) | 25 | Open-Meteo Land-Surface Model |
| 2 | Rainfall Accumulation (7-day) | 25 | Open-Meteo Historical |
| 3 | Earthquake Activity (30-day) | 25 | USGS FDSN |
| 4 | Regional Geological Susceptibility | 15 | India landslide-prone zone map |
| 5 | Deep Soil Saturation (28–100 cm) | 10 | Open-Meteo Land-Surface Model |

**Total possible: 100 points** (capped at 100)

#### Factor 1: Surface Soil Moisture (0–25 points)
```
if soilMoisture > 0.45 m³/m³  → +25 pts  ("Saturated soil")
if soilMoisture > 0.35 m³/m³  → +18 pts  ("Very wet soil")
if soilMoisture > 0.25 m³/m³  → +12 pts  ("Wet soil")
if soilMoisture > 0.15 m³/m³  → +5  pts  ("Moderate soil moisture")
otherwise                     → +0  pts
```

#### Factor 2: 7-Day Rainfall Accumulation (0–25 points)
```
if rainfallAccum > 200 mm  → +25 pts  ("Extreme rain accumulation")
if rainfallAccum > 120 mm  → +18 pts  ("Very high rain accumulation")
if rainfallAccum > 60  mm  → +12 pts  ("High rain accumulation")
if rainfallAccum > 25  mm  → +5  pts  ("Moderate rain accumulation")
otherwise                  → +0  pts
```

#### Factor 3: Earthquake Activity (0–25 points)
```
if maxMagnitude > 5.5            → +25 pts  ("Strong earthquake")
if maxMagnitude > 4.5            → +18 pts  ("Moderate-strong quake")
if maxMagnitude > 3.5            → +12 pts  ("Moderate quake")
if earthquakeCount > 0 (any M≥2.5) → +5 pts ("Minor seismic activity")
otherwise                        → +0  pts
```

#### Factor 4: Regional Susceptibility (0–15 points)
```
if dam is in HIGH landslide zone    → +15 pts  (Western Ghats, Himalayas)
if dam is in MEDIUM landslide zone  → +8  pts  (Northeast Hills, Eastern Ghats)
if dam is in LOW or no zone         → +0  pts
```

#### Factor 5: Deep Soil Moisture — 28–100 cm (0–10 points)
```
if deepSoilMoisture > 0.40 m³/m³  → +10 pts  ("Deep soil saturated")
if deepSoilMoisture > 0.30 m³/m³  → +6  pts  ("Deep soil wet")
if deepSoilMoisture > 0.20 m³/m³  → +3  pts  ("Deep soil moderately moist")
otherwise                         → +0  pts
```

#### Final Classification
```
Score ≥ 70  →  HIGH risk
Score ≥ 40  →  MEDIUM risk
Score < 40  →  LOW risk
```

---

## 7. Reservoir Level Estimation

Since India's Central Water Commission (CWC) does not provide a free public API, reservoir levels are **estimated** using a deterministic formula that combines seasonal baselines with live environmental data.

### Formula

```
ReservoirLevel = clamp(
    SeasonalBaseline
  + DamVariation
  + RainfallAdjustment
  + DischargeAdjustment
  + SoilAdjustment
  + BaseFlowAdjustment,
  10, 98
)
```

### Component Breakdown

#### 1. Seasonal Baseline (India's dam-filling pattern)
Indian reservoirs fill during the monsoon (Jun–Oct) and deplete Nov–May. CWC historical averages inform the baseline:

```
Month:    Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
Baseline:  38   35   33   30   28   32   45   58   70   75   65   50  (%)
```

#### 2. Dam-Specific Variation
Larger capacity dams retain more water:
```
capFactor = min(dam.capacity / 100, 1)       // 0–1 scale
damVariation = (capFactor × 15) − 7          // Range: −7 to +8 %
```

#### 3. Rainfall Adjustment (from live 7-day data)
```
rainAdjust = min(cumulativePrecip7d / 10, 15)  // Each 10mm ≈ +1%, capped at +15%
```

#### 4. Discharge Adjustment (from live GloFAS data)
```
dischRatio = min(latestDischarge / maxDischarge, 1)
dischAdjust = dischRatio × 12                   // 0–12%
```

#### 5. Soil Moisture Adjustment (from live Open-Meteo data)
```
soilAdjust = min(soilMoisture / 0.4, 1) × 8    // 0–8%
```
Saturated soil = more runoff into reservoir.

#### 6. Base Flow Adjustment (average discharge)
```
avgDischAdjust = min(avgDischarge / 100, 1) × 5  // 0–5%
```

#### Trend Detection
```
recent  = sum(last 3 days precipitation)
earlier = sum(first 3 days precipitation)

if recent > earlier × 1.3  → trend = "increasing"
if recent < earlier × 0.7  → trend = "decreasing"
otherwise                  → trend = "stable"
```

**Total possible range:** 10% to 98% (clamped)

---

## 8. Alert Generation Logic

Alerts are generated per dam based on computed flood and landslide risk scores.

### Alert Severities

| Severity | Condition | Purpose |
|----------|----------|---------|
| **HIGH** | Risk level = HIGH (score ≥ 70) | Immediate danger warning |
| **MEDIUM** | Risk level = MEDIUM (score 40–69) | Elevated risk advisory |
| **INFO** | Risk level = LOW but score ≥ 8 (flood) or ≥ 10 (landslide) | Situational awareness |

### Alert Structure
```javascript
{
  id: "flood-high-sardar-sarovar",   // Unique: {type}-{severity}-{dam-slug}
  type: "FLOOD" | "LANDSLIDE",
  severity: "HIGH" | "MEDIUM" | "INFO",
  location: "Sardar Sarovar",
  score: 75,
  message: "HIGH FLOOD RISK at Sardar Sarovar. Critical reservoir level (87.3%); ...",
  timestamp: "2026-02-20T10:30:00.000Z"
}
```

### Deduplication
Alert IDs use the dam name as a slug (e.g., `flood-high-sardar-sarovar`), ensuring:
- Each dam generates at most 1 flood alert and 1 landslide alert
- No duplicate alerts across batch processing of 61 dams
- Alerts are globally unique and stable between refreshes

---

## 9. 24-Hour Prediction Model

The prediction model is **fully deterministic** — no random values.

### Formula
```
predicted24h = clamp(currentScore + delta, 0, 100)
```

### Delta Calculation
```
Base delta from trend:
  if trend == "increasing"  → delta = +12
  if trend == "stable"      → delta = +3
  if trend == "decreasing"  → delta = −8

Additional adjustments:
  if riverDischarge > 500 m³/s   → delta += 5
  if soilMoisture > 0.35 m³/m³  → delta += 4
  if earthquakeCount > 0         → delta += 3
```

### Prediction Confidence
Base confidence starts at 60% and increases with available data sources:
```
+10% if weather data available
+10% if soil data available
+10% if discharge data available
+10% if seismic data available

Maximum: 95%
```

### Output
```javascript
{
  current: 45,
  predicted24h: 60,
  trend: "increasing",
  change: +15,
  confidence: 90  // 60 base + 10 + 10 + 10 = 90%
}
```

---

## 10. Risk Trend Chart (±24h) — Past Estimation

The frontend displays a 9-point chart spanning from -24h to +24h. Since we don't have actual past risk scores, the past portion is **estimated from daily precipitation history**.

### Past Risk Estimation

#### Flood Risk (past 24h)
```
yesterdayRain = dailyHistory[last - 2].precipitation
todayRain    = environmentalData.rainfall.forecast

rainRatio    = yesterdayRain / todayRain  (or 1.2 if today=0 and yesterday>0, else 0.8)
floodPast24  = clamp(floodCurrent × min(rainRatio, 1.5), 0, 100)
```

#### Landslide Risk (past 24h)
Soil moisture changes slowly, so a dampened estimate is used:
```
dayBeforeRain = dailyHistory[last - 3].precipitation
rainRatio2    = dayBeforeRain / todayRain  (dampened)
lsPast24      = clamp(lsCurrent × min(rainRatio2, 1.3), 0, 100)
```

### Interpolation
Linear interpolation creates smooth transitions:
```
lerp(a, b, steps) = [a, ..., b] evenly spaced over `steps` points

pastFlood   = lerp(floodPast24, floodCurrent, 5)    // -24h → Now
futureFlood = lerp(floodCurrent, floodPredicted, 5)  // Now → +24h
combined    = [...pastFlood, ...futureFlood.slice(1)] // 9 points total
```

### Chart Labels
```
['-24h', '-18h', '-12h', '-6h', 'Now', '+6h', '+12h', '+18h', '+24h']
```

The "Now" point is rendered with a larger dot (radius 6 vs 3) and a dashed vertical guide line.

---

## 11. Caching Strategy

### In-Memory Cache
- **Implementation:** JavaScript `Map` with TTL
- **Default TTL:** 10 minutes (configurable via `CACHE_DURATION` env var)
- **Key format:** `{data-type}-{latitude}-{longitude}[-{extra}]`
  - Examples: `weather-fc-21.83-73.748`, `soil-21.83-73.748`, `quake-21.83-73.748-300`

### Why Cache?
- 61 dams × 6 API calls each = **366 external API calls** per full refresh
- Without cache, each page load would take 60–90 seconds
- With cache (10-min TTL), subsequent loads are near-instant
- Cache keys include coordinates, so different dams don't share cached data

### Cache Flow
```
Request → Check cache(key)
  ├─ HIT (< 10 min old)  → Return cached value immediately
  └─ MISS or EXPIRED     → Fetch from live API → Store in cache → Return
```

---

## 12. Frontend Implementation

### Views
1. **Dashboard** — KPI cards (total dams, high-risk zones, avg rainfall, earthquakes), risk distribution chart, alert summary
2. **Map** — Interactive Leaflet map of India with dam markers colored by risk level (green/amber/red), click to view details
3. **Charts/Analytics** — Rainfall forecast chart, risk trend (±24h), reservoir levels (all 61 dams)

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `App.js` | `frontend/src/App.js` | Main layout, data fetching, state management |
| `Dashboard` | `components/Dashboard.jsx` | KPI cards, risk distribution, alert summary |
| `MapComponent` | `components/Map.jsx` | Leaflet map with dam markers |
| `Charts` | `components/Charts.jsx` | RainfallChart, RiskTrendChart, ReservoirChart |
| `RiskPanel` | `components/RiskPanel.jsx` | Risk details & alerts sidebar |
| `Layout` | `components/Layout.jsx` | Header, Drawer, Footer |
| `Common` | `components/Common.jsx` | InfoCard, LoadingSpinner, ErrorAlert |
| `api.js` | `services/api.js` | Axios client for backend API calls |
| `helpers.js` | `utils/helpers.js` | Utility functions |

### Data Flow
```
App.js mounts
  → fetchData() calls 4 APIs in parallel:
     • GET /api/data/dams        → setDams()
     • GET /api/risk/all         → setRisks()
     • GET /api/risk/alerts      → setAlerts()
     • GET /api/data/reservoirs  → setReservoirData()
  → When user selects a dam:
     • POST /api/risk/calculate  → setSelectedRiskData()
     • GET /api/data/rainfall   → setRainfallData()
```

### Auto-Refresh
Data refreshes automatically every **10 minutes** via `setInterval`.

### Responsive Design
- Mobile-first with Tailwind CSS breakpoints (`sm:`, `md:`, `lg:`)
- Map height: `clamp(300px, 50vh, 600px)`
- Viewport: `100dvh` (dynamic viewport height for mobile browsers)
- Responsive padding: `p-3 sm:p-4 md:p-8`

---

## 13. API Endpoints Reference

### Data Endpoints (`/api/data/`)

| Method | Endpoint | Parameters | Returns |
|--------|----------|-----------|---------|
| GET | `/data/dams` | — | All 61 dam locations |
| GET | `/data/rainfall` | `latitude`, `longitude` | Forecast + historical rainfall + NASA satellite |
| GET | `/data/earthquakes` | `latitude`, `longitude`, `radius` | USGS earthquake events (M≥2.5, 30 days) |
| GET | `/data/reservoirs` | — | Estimated reservoir levels for all dams |
| GET | `/data/soil` | `latitude`, `longitude` | Soil moisture at 3 depth layers |
| GET | `/data/discharge` | `latitude`, `longitude` | River discharge (GloFAS) |
| GET | `/data/all` | `latitude`, `longitude` | All environmental data combined |

### Risk Endpoints (`/api/risk/`)

| Method | Endpoint | Parameters | Returns |
|--------|----------|-----------|---------|
| POST | `/risk/calculate` | `{ damId }` (body) | Full risk analysis for one dam |
| GET | `/risk/all` | — | Risk overview for all 61 dams |
| GET | `/risk/alerts` | `severity` (optional: HIGH/MEDIUM/INFO/all) | Active alerts |

### Health Check

| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/api/health` | Status, mode, data sources, timestamp |

---

## 14. Deployment Architecture

### Railway Configuration

Two services in one Railway project (`envo-project`):

#### Backend Service
- **Dockerfile:** Root `Dockerfile`
- **Base image:** `node:18-alpine`
- **Build:** `npm install --production` + copies `backend/` directory
- **Port:** Dynamic (`$PORT`, Railway assigns 8080)
- **Binds to:** `0.0.0.0` (required for Railway container networking)
- **Server timeout:** 120 seconds
- **Rate limit:** 500 requests per 15-minute window

#### Frontend Service
- **Dockerfile:** `Dockerfile.frontend`
- **Build stage:** `node:18-alpine`, installs dependencies, runs `npm run build`
- **Build arg:** `REACT_APP_API_URL` baked at build time
- **Serve stage:** `node:18-alpine` + `serve -s build -l ${PORT:-3000}`
- **Port:** Dynamic (`$PORT`)

#### CORS Configuration
```javascript
// Backend allows:
// 1. Requests with no origin (mobile apps, curl)
// 2. Any localhost origin (development)
// 3. Any *.up.railway.app origin (Railway deployments)
// 4. Custom FRONTEND_URL env var (custom domains)
```

#### Environment Variables
| Variable | Service | Value |
|----------|---------|-------|
| `NODE_ENV` | Backend | `production` |
| `FRONTEND_URL` | Backend | `https://frontend-production-35ae.up.railway.app` |
| `REACT_APP_API_URL` | Frontend | `https://envo-project-production.up.railway.app/api` |

---

## 15. Performance & Scalability

### Batch Processing
All 61 dams are processed in **parallel batches of 5** to balance speed vs API rate limits:
```javascript
async function processBatched(items, fn, batchSize = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}
```
- 61 dams ÷ 5 = 13 batches, each batch runs 5 dams concurrently
- Each dam makes 6 API calls in parallel via `Promise.all`
- Total: ~366 API calls, processed in ~13 sequential rounds

### Per-Dam Data Fetching
6 API calls per dam, all in parallel:
```javascript
const [weather, historical, soil, flood, quakes, reservoirs] = await Promise.all([
  apiService.fetchRainfallForecast(dam.latitude, dam.longitude),
  apiService.fetchHistoricalRainfall(dam.latitude, dam.longitude, 7),
  apiService.fetchSoilMoisture(dam.latitude, dam.longitude),
  apiService.fetchRiverDischarge(dam.latitude, dam.longitude),
  apiService.fetchEarthquakeData(dam.latitude, dam.longitude, 300),
  apiService.fetchReservoirLevels([dam]),
]);
```

### Timeouts
| Component | Timeout |
|-----------|---------|
| External API calls | 15 seconds per call |
| NASA POWER API | 20 seconds (slower) |
| Express server | 120 seconds |
| Frontend Axios client | 120 seconds |

### First Load vs Cached Load
- **First load (empty cache):** 30–90 seconds (366 API calls)
- **Cached load (within 10 min):** < 1 second
- **Auto-refresh:** Every 10 minutes (frontend), cache TTL 10 minutes (backend)

---

## 16. File Structure

```
Environment_project/
├── Dockerfile                    # Backend container (node:18-alpine)
├── Dockerfile.frontend           # Frontend container (multi-stage: build + serve)
├── .dockerignore                 # Excludes node_modules, .md, .git, etc.
├── docker-compose.yml            # Local dev (optional)
├── REPORT.md                     # This document
│
├── backend/
│   ├── server.js                 # Express server, CORS, rate limiting, health check
│   ├── package.json              # Dependencies (express, axios, cors, etc.)
│   ├── mock-server.js            # Local mock server (not used in production)
│   │
│   ├── controllers/
│   │   ├── dataController.js     # Endpoints for rainfall, earthquakes, soil, etc.
│   │   └── riskController.js     # Risk calculation, batch processing, alerts
│   │
│   ├── routes/
│   │   ├── dataRoutes.js         # /api/data/* routes
│   │   └── riskRoutes.js         # /api/risk/* routes
│   │
│   ├── services/
│   │   ├── apiService.js         # All 6 live API integrations
│   │   └── riskAnalysisService.js # Flood + landslide scoring, alerts, prediction
│   │
│   └── utils/
│       ├── cache.js              # In-memory cache with TTL
│       └── damLocations.js       # 61 dams + 5 landslide-prone zones
│
└── frontend/
    ├── package.json              # React, Chart.js, Leaflet, Tailwind, Axios
    ├── tailwind.config.js        # Tailwind configuration
    ├── postcss.config.js         # PostCSS plugins
    │
    ├── public/
    │   └── index.html            # HTML template
    │
    └── src/
        ├── App.js                # Main component, routing, state management
        ├── index.js              # React DOM render
        ├── index.css             # Tailwind + custom styles + responsive
        │
        ├── components/
        │   ├── Charts.jsx        # RainfallChart, RiskTrendChart, ReservoirChart
        │   ├── Common.jsx        # InfoCard, LoadingSpinner, ErrorAlert
        │   ├── Dashboard.jsx     # KPI cards, risk distribution, alert summary
        │   ├── Layout.jsx        # Header, Drawer (sidebar), Footer
        │   ├── Map.jsx           # Leaflet map with colored dam markers
        │   └── RiskPanel.jsx     # Risk details panel, alerts list
        │
        ├── services/
        │   └── api.js            # Axios client, dataAPI, riskAPI exports
        │
        └── utils/
            └── helpers.js        # Utility functions
```

---

## 17. How It All Works End-to-End

### Step 1: User Opens the Website
- Browser loads the React app from `https://frontend-production-35ae.up.railway.app`
- `App.js` mounts and calls `fetchData()` immediately

### Step 2: Frontend Fetches Data
Four API calls are made in parallel to the backend:
```
GET /api/data/dams        → Returns 61 dam locations
GET /api/risk/all         → Returns risk scores for all 61 dams
GET /api/risk/alerts      → Returns all active alerts
GET /api/data/reservoirs  → Returns estimated reservoir levels
```

### Step 3: Backend Processes Each Dam (in batches of 5)
For each dam, the backend:
1. Checks the in-memory cache (10-min TTL)
2. If cache miss, calls 6 external APIs in parallel for that dam:
   - Open-Meteo Weather Forecast (7-day)
   - Open-Meteo Historical Rainfall (7-day)
   - Open-Meteo Soil Moisture (5 depth layers)
   - Open-Meteo GloFAS River Discharge (7-day)
   - NASA POWER Satellite Precipitation (14-day) — for single-dam detail only
   - USGS Earthquake Data (300 km radius, 30 days)
3. Caches each API response for 10 minutes

### Step 4: Risk Engine Computes Scores
With the live data:
1. **Flood Risk** = weighted sum of reservoir level + forecast rainfall + historical rainfall + river discharge + rainfall trend → score 0–100
2. **Landslide Risk** = weighted sum of soil moisture + rainfall accumulation + earthquake activity + regional susceptibility + deep soil moisture → score 0–100
3. **Reservoir Level** = seasonal baseline + dam variation + live data adjustments → 10–98%
4. **Alerts** = generated based on severity thresholds (HIGH ≥ 70, MEDIUM ≥ 40, INFO ≥ 8/10)
5. **24h Prediction** = current score ± trend-based delta + additional factor adjustments

### Step 5: Frontend Renders the Dashboard
- **Dashboard tab:** KPI cards, risk distribution (LOW/MEDIUM/HIGH counts), alert summary
- **Map tab:** Leaflet map of India, each dam is a colored circle marker (green=LOW, amber=MEDIUM, red=HIGH), clicking a dam shows its details
- **Charts tab:** Rainfall forecast bar chart, risk trend line chart (-24h to +24h), reservoir levels horizontal bar chart for all 61 dams

### Step 6: User Selects a Dam
When the user clicks a dam on the map or selects from the sidebar:
```
POST /api/risk/calculate  { damId: "sardar-sarovar" }
```
Returns the full detailed analysis:
- Flood risk score + contributing factors
- Landslide risk score + contributing factors
- 24h prediction for both
- Environmental data (rainfall, earthquakes, reservoir, soil)
- Data source attribution

### Step 7: Auto-Refresh
Every 10 minutes, the frontend automatically re-fetches all data, keeping the dashboard current.

---

## Summary of Mathematical Models

| Model | Formula | Range | Inputs |
|-------|---------|-------|--------|
| Flood Risk | Σ(5 weighted factors) | 0–100 | Reservoir, forecast rain, cumulative rain, discharge, trend |
| Landslide Risk | Σ(5 weighted factors) | 0–100 | Soil moisture, rain accumulation, earthquakes, region, deep soil |
| Reservoir Level | Seasonal base + live adjustments | 10–98% | Month, capacity, 7d rain, discharge, soil moisture |
| 24h Prediction | current + Δ(trend, factors) | 0–100 | Current score, trend, discharge, soil saturation, seismicity |
| Past Risk Estimate | current × rain ratio | 0–100 | Current score, yesterday/today rain ratio |
| Haversine Distance | 2R·arctan2(√a, √(1−a)) | km | Lat/lon of two points |
| Prediction Confidence | 60 + 10×(data sources present) | 60–95% | Availability of 4 data sources |

---

*Report generated on February 20, 2026. All data in the live system is fetched in real-time from Open-Meteo, NASA POWER, USGS, and GloFAS APIs.*
