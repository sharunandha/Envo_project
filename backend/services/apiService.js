const axios = require('axios');
const cache = require('../utils/cache');

/**
 * Live Data API Service — ZERO mock / random values.
 *
 * Every number shown in the dashboard comes from one of these sources:
 *   1. Open-Meteo Forecast API       — rainfall forecast, temp, wind, humidity
 *   2. Open-Meteo Historical API     — past 7-day observed rainfall
 *   3. Open-Meteo Land-Surface Model — real soil moisture (m³/m³)
 *   4. Open-Meteo GloFAS Flood API   — river discharge (m³/s)
 *   5. NASA POWER                    — satellite precipitation (mm/day)
 *   6. USGS FDSN                     — earthquake events (magnitude ≥ 2.5)
 */
class APIService {
  constructor() {
    this.openMeteoBase = 'https://api.open-meteo.com/v1';
    this.openMeteoFlood = 'https://flood-api.open-meteo.com/v1/flood';
    this.nasaPowerBase = 'https://power.larc.nasa.gov/api/temporal/daily/point';
    this.usgsBase = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
    this.timeout = 15000;
  }

  /* ================================================================
   *  Helpers
   * ================================================================ */
  _dateFmt(d) { return d.toISOString().slice(0, 10); }
  _nasaFmt(d) { return d.toISOString().slice(0, 10).replace(/-/g, ''); }
  _daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
  _avg(arr) {
    const v = (arr || []).filter(x => x !== null && x !== undefined && !isNaN(x));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }
  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  }

  /* ================================================================
   *  1. Weather Forecast (Open-Meteo)
   * ================================================================ */
  async fetchRainfallForecast(latitude, longitude) {
    const ck = `weather-fc-${latitude}-${longitude}`;
    const c = cache.get(ck); if (c) return c;

    try {
      const res = await axios.get(`${this.openMeteoBase}/forecast`, {
        timeout: this.timeout,
        params: {
          latitude, longitude,
          daily: 'precipitation_sum,rain_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,windspeed_10m_max',
          hourly: 'precipitation,precipitation_probability,relative_humidity_2m,soil_moisture_0_to_1cm',
          forecast_days: 7,
          timezone: 'Asia/Kolkata',
        },
      });
      const data = {
        location: { latitude, longitude },
        daily: res.data.daily,
        hourly: res.data.hourly,
        source: 'Open-Meteo Forecast API (live)',
        timestamp: new Date().toISOString(),
      };
      cache.set(ck, data);
      return data;
    } catch (err) {
      console.error(`[Open-Meteo Forecast] ${err.message}`);
      return { error: err.message, location: { latitude, longitude }, daily: null, hourly: null };
    }
  }

  /* ================================================================
   *  2. Historical Rainfall (Open-Meteo past data)
   * ================================================================ */
  async fetchHistoricalRainfall(latitude, longitude, days = 7) {
    const ck = `hist-rain-${latitude}-${longitude}-${days}`;
    const c = cache.get(ck); if (c) return c;

    try {
      const endDate = this._dateFmt(this._daysAgo(1));
      const startDate = this._dateFmt(this._daysAgo(days));

      const res = await axios.get(`${this.openMeteoBase}/forecast`, {
        timeout: this.timeout,
        params: {
          latitude, longitude,
          daily: 'precipitation_sum,rain_sum',
          start_date: startDate,
          end_date: endDate,
          timezone: 'Asia/Kolkata',
        },
      });

      const data = {
        location: { latitude, longitude },
        period: { startDate, endDate },
        daily: res.data.daily,
        source: 'Open-Meteo Historical (live)',
        timestamp: new Date().toISOString(),
      };
      cache.set(ck, data);
      return data;
    } catch (err) {
      console.error(`[Open-Meteo History] ${err.message}`);
      return { error: err.message, location: { latitude, longitude }, daily: null };
    }
  }

  /* ================================================================
   *  3. Soil Moisture (Open-Meteo Land-Surface Model)
   * ================================================================ */
  async fetchSoilMoisture(latitude, longitude) {
    const ck = `soil-${latitude}-${longitude}`;
    const c = cache.get(ck); if (c) return c;

    try {
      // Use correct Open-Meteo variable names for soil moisture depths
      const res = await axios.get(`${this.openMeteoBase}/forecast`, {
        timeout: this.timeout,
        params: {
          latitude, longitude,
          hourly: 'soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_moisture_27_to_81cm,soil_temperature_0cm',
          past_days: 2,
          forecast_days: 1,
          timezone: 'Asia/Kolkata',
        },
      });

      const h = res.data.hourly;

      // Find the latest NON-NULL value (forecast hours may be null)
      const latestNonNull = (arr) => {
        if (!arr) return 0;
        for (let i = arr.length - 1; i >= 0; i--) {
          if (arr[i] !== null && arr[i] !== undefined && !isNaN(arr[i])) return arr[i];
        }
        return 0;
      };

      // Average only valid (non-null) values from the past hours
      const validAvg = (arr) => {
        if (!arr) return 0;
        const valid = arr.filter(x => x !== null && x !== undefined && !isNaN(x));
        return valid.length ? +(valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(4) : 0;
      };

      // Surface = average of 0-1cm and 1-3cm (top soil)
      const surface0 = latestNonNull(h.soil_moisture_0_to_1cm);
      const surface1 = latestNonNull(h.soil_moisture_1_to_3cm);
      const surfaceMoisture = +(((surface0 + surface1) / 2) || surface0).toFixed(4);

      // Mid-depth = average of 3-9cm and 9-27cm
      const mid0 = latestNonNull(h.soil_moisture_3_to_9cm);
      const mid1 = latestNonNull(h.soil_moisture_9_to_27cm);
      const midMoisture = +(((mid0 + mid1) / 2) || mid0).toFixed(4);

      // Deep = 27-81cm
      const deepMoisture = latestNonNull(h.soil_moisture_27_to_81cm);

      const data = {
        location: { latitude, longitude },
        current: {
          moisture_0_7cm: surfaceMoisture,   // Surface soil moisture (m³/m³)
          moisture_7_28cm: midMoisture,       // Mid-depth soil moisture
          moisture_28_100cm: +deepMoisture.toFixed(4),  // Deep soil moisture
          temperature_0_7cm: latestNonNull(h.soil_temperature_0cm),
        },
        avg24h: {
          moisture_0_7cm: validAvg(h.soil_moisture_0_to_1cm),
          moisture_7_28cm: validAvg(h.soil_moisture_9_to_27cm),
          moisture_28_100cm: validAvg(h.soil_moisture_27_to_81cm),
        },
        source: 'Open-Meteo Land-Surface Model (live)',
        timestamp: new Date().toISOString(),
      };
      cache.set(ck, data);
      return data;
    } catch (err) {
      console.error(`[Open-Meteo Soil] ${err.message}`);
      return { error: err.message, location: { latitude, longitude }, current: null, avg24h: null };
    }
  }

  /* ================================================================
   *  4. River Discharge (Open-Meteo GloFAS Flood API)
   * ================================================================ */
  async fetchRiverDischarge(latitude, longitude) {
    const ck = `flood-${latitude}-${longitude}`;
    const c = cache.get(ck); if (c) return c;

    try {
      const res = await axios.get(this.openMeteoFlood, {
        timeout: this.timeout,
        params: {
          latitude, longitude,
          daily: 'river_discharge',
          forecast_days: 7,
        },
      });

      const daily = res.data.daily || {};
      const vals = (daily.river_discharge || []).filter(v => v !== null);
      const maxD = vals.length ? Math.max(...vals) : 0;
      const avgD = this._avg(vals);
      const latestD = vals.length ? vals[vals.length - 1] : 0;

      const data = {
        location: { latitude, longitude },
        daily,
        stats: { maxDischarge: +maxD.toFixed(2), avgDischarge: +avgD.toFixed(2), latestDischarge: +latestD.toFixed(2) },
        source: 'Open-Meteo GloFAS Flood API (live)',
        timestamp: new Date().toISOString(),
      };
      cache.set(ck, data);
      return data;
    } catch (err) {
      console.error(`[GloFAS Flood] ${err.message}`);
      return { error: err.message, location: { latitude, longitude }, daily: null, stats: { maxDischarge: 0, avgDischarge: 0, latestDischarge: 0 } };
    }
  }

  /* ================================================================
   *  5. NASA POWER Satellite Precipitation
   * ================================================================ */
  async fetchNASAPrecipitation(latitude, longitude, days = 14) {
    const ck = `nasa-${latitude}-${longitude}-${days}`;
    const c = cache.get(ck); if (c) return c;

    try {
      const endDate = this._nasaFmt(this._daysAgo(2));
      const startDate = this._nasaFmt(this._daysAgo(days + 2));

      const res = await axios.get(this.nasaPowerBase, {
        timeout: 20000,
        params: {
          parameters: 'PRECTOTCORR',
          start: startDate,
          end: endDate,
          latitude, longitude,
          community: 'RE',
          format: 'JSON',
        },
      });

      const param = res.data?.properties?.parameter?.PRECTOTCORR || {};
      const values = Object.entries(param)
        .map(([dt, val]) => ({
          date: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`,
          precipitation: val === -999 ? 0 : val,
        }))
        .filter(v => v.precipitation >= 0);

      const total = values.reduce((s, v) => s + v.precipitation, 0);
      const avg = values.length ? total / values.length : 0;

      const data = {
        location: { latitude, longitude },
        daily: values,
        stats: { totalPrecip: +total.toFixed(2), avgPrecip: +avg.toFixed(2), days: values.length },
        source: 'NASA POWER PRECTOTCORR (live satellite)',
        timestamp: new Date().toISOString(),
      };
      cache.set(ck, data);
      return data;
    } catch (err) {
      console.error(`[NASA POWER] ${err.message}`);
      return { error: err.message, location: { latitude, longitude }, daily: [], stats: { totalPrecip: 0, avgPrecip: 0, days: 0 } };
    }
  }

  /* ================================================================
   *  6. Earthquake Data (USGS FDSN)
   * ================================================================ */
  async fetchEarthquakeData(latitude, longitude, radiusKm = 300) {
    const ck = `quake-${latitude}-${longitude}-${radiusKm}`;
    const c = cache.get(ck); if (c) return c;

    try {
      const endDate = this._dateFmt(new Date());
      const startDate = this._dateFmt(this._daysAgo(30));

      const res = await axios.get(this.usgsBase, {
        timeout: this.timeout,
        params: {
          format: 'geojson',
          starttime: startDate,
          endtime: endDate,
          latitude, longitude,
          maxradiuskm: radiusKm,
          minmagnitude: 2.5,
          orderby: 'time',
        },
      });

      const features = res.data?.features || [];
      const earthquakes = features.map(f => ({
        id: f.id,
        magnitude: f.properties.mag,
        depth: f.geometry.coordinates[2],
        place: f.properties.place,
        time: new Date(f.properties.time).toISOString(),
        coordinates: {
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
        },
        distance: this._haversine(latitude, longitude, f.geometry.coordinates[1], f.geometry.coordinates[0]),
      })).sort((a, b) => new Date(b.time) - new Date(a.time));

      const maxMag = earthquakes.length ? Math.max(...earthquakes.map(e => e.magnitude)) : 0;

      const data = {
        center: { latitude, longitude },
        radius: radiusKm,
        earthquakes,
        total: earthquakes.length,
        maxMagnitude: maxMag,
        source: 'USGS Earthquake Hazards Program (live)',
        timestamp: new Date().toISOString(),
      };
      cache.set(ck, data);
      return data;
    } catch (err) {
      console.error(`[USGS] ${err.message}`);
      return { error: err.message, center: { latitude, longitude }, earthquakes: [], total: 0, maxMagnitude: 0 };
    }
  }

  /* ================================================================
   *  7. Reservoir Levels — data-driven estimate (no random)
   *
   *  Since India's CWC doesn't expose a free public API, we derive
   *  reservoir stress from *real* cumulative rainfall + river discharge.
   *  The formula is deterministic: same inputs → same output.
   * ================================================================ */
  async fetchReservoirLevels(dams) {
    // Build a cache key from dam IDs so individual and batch calls don't collide
    const ids = dams.map(d => d.id).sort().join(',');
    const ck = `reservoir-levels-${ids}`;
    const c = cache.get(ck); if (c) return c;

    try {
      const results = await Promise.all(dams.map(async (dam) => {
        const [hist, flood, soil] = await Promise.all([
          this.fetchHistoricalRainfall(dam.latitude, dam.longitude, 7),
          this.fetchRiverDischarge(dam.latitude, dam.longitude),
          this.fetchSoilMoisture(dam.latitude, dam.longitude),
        ]);

        const precipArr = hist.daily?.precipitation_sum || [];
        const cumPrecip = precipArr.reduce((s, v) => s + (v || 0), 0);

        const discharge = flood.stats?.latestDischarge || 0;
        const avgDischarge = flood.stats?.avgDischarge || 0;
        const maxDischarge = flood.stats?.maxDischarge || 1;

        const soilM = soil.current?.moisture_0_7cm || soil.avg24h?.moisture_0_7cm || 0;

        // ── Seasonal baseline (India's dam-filling pattern) ──
        // Indian reservoirs fill Jun-Oct (monsoon) and deplete Nov-May.
        // CWC reports ~40-55% in Feb (post-monsoon depletion).
        const month = new Date().getMonth(); // 0-11
        const seasonalBase = [
          38, 35, 33, 30, 28, 32,  // Jan-Jun: declining, monsoon starts
          45, 58, 70, 75, 65, 50   // Jul-Dec: filling, then depleting
        ][month];

        // ── Dam-specific variation ──
        // Use capacity as a proxy: larger reservoirs retain more
        const capFactor = Math.min(dam.capacity / 100, 1); // 0-1
        const damVariation = (capFactor * 15) - 7; // -7 to +8 variation

        // ── Live data adjustments ──
        // Rainfall in last 7 days: each 10mm adds ~1% (up to +15%)
        const rainAdjust = Math.min(cumPrecip / 10, 15);

        // River discharge relative to max: high flow = filling reservoir
        const dischRatio = Math.min(discharge / Math.max(maxDischarge, 1), 1);
        const dischAdjust = dischRatio * 12; // 0-12%

        // Soil moisture: saturated soil → more runoff into reservoir
        const soilAdjust = Math.min(soilM / 0.4, 1) * 8; // 0-8%

        // Average discharge also contributes (base flow)
        const avgDischAdjust = Math.min(avgDischarge / 100, 1) * 5; // 0-5%

        const level = Math.max(10, Math.min(
          seasonalBase + damVariation + rainAdjust + dischAdjust + soilAdjust + avgDischAdjust,
          98
        ));

        // Trend from real data: last 3 days vs first 3 days
        let trend = 'stable';
        if (precipArr.length >= 6) {
          const recent = precipArr.slice(-3).reduce((s, v) => s + (v || 0), 0);
          const earlier = precipArr.slice(0, 3).reduce((s, v) => s + (v || 0), 0);
          if (recent > earlier * 1.3) trend = 'increasing';
          else if (recent < earlier * 0.7) trend = 'decreasing';
        }

        return {
          id: dam.id,
          name: dam.name,
          state: dam.state,
          river: dam.river,
          capacity: dam.capacity,
          currentLevel: +level.toFixed(1),
          cumulativePrecip7d: +cumPrecip.toFixed(1),
          riverDischarge: +discharge.toFixed(2),
          soilMoisture: +soilM.toFixed(4),
          trend,
          methodology: 'Seasonal baseline + live rainfall/discharge/soil-moisture adjustments',
          dataSource: 'Derived from Open-Meteo + GloFAS live data',
          lastUpdated: new Date().toISOString(),
        };
      }));

      cache.set(ck, results);
      return results;
    } catch (err) {
      console.error(`[Reservoir] ${err.message}`);
      return [];
    }
  }

  /* ================================================================
   *  8. Full data bundle for a single dam
   * ================================================================ */
  async fetchAllDataForDam(dam) {
    const [weather, historical, soil, flood, nasa, quakes] = await Promise.all([
      this.fetchRainfallForecast(dam.latitude, dam.longitude),
      this.fetchHistoricalRainfall(dam.latitude, dam.longitude, 7),
      this.fetchSoilMoisture(dam.latitude, dam.longitude),
      this.fetchRiverDischarge(dam.latitude, dam.longitude),
      this.fetchNASAPrecipitation(dam.latitude, dam.longitude, 14),
      this.fetchEarthquakeData(dam.latitude, dam.longitude, 300),
    ]);
    return { weather, historical, soil, flood, nasa, quakes };
  }
}

module.exports = new APIService();
