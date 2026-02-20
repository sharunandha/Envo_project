const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// --- Sample dams (10) ---
const dams = [
  { id: 'd1', name: 'Narmada Main Dam', state: 'Madhya Pradesh', region: 'Narmada', latitude: 22.7, longitude: 75.8 },
  { id: 'd2', name: 'Sutlej Upper Dam', state: 'Himachal Pradesh', region: 'Sutlej', latitude: 31.5, longitude: 76.9 },
  { id: 'd3', name: 'Bhagirathi Head', state: 'Uttarakhand', region: 'Bhagirathi', latitude: 30.5, longitude: 78.9 },
  { id: 'd4', name: 'Kaveri Reservoir', state: 'Karnataka', region: 'Kaveri', latitude: 12.9, longitude: 77.6 },
  { id: 'd5', name: 'Damodar Barrage', state: 'Jharkhand', region: 'Damodar', latitude: 23.6, longitude: 86.1 },
  { id: 'd6', name: 'Periyar Dam', state: 'Kerala', region: 'Periyar', latitude: 10.1, longitude: 76.8 },
  { id: 'd7', name: 'Koyna Reservoir', state: 'Maharashtra', region: 'Koyna', latitude: 17.0, longitude: 73.7 },
  { id: 'd8', name: 'Tehri Upper', state: 'Uttarakhand', region: 'Bhagirathi', latitude: 30.4, longitude: 78.5 },
  { id: 'd9', name: 'Sardar Sarovar', state: 'Gujarat', region: 'Narmada', latitude: 21.8, longitude: 73.5 },
  { id: 'd10', name: 'Mettur Reservoir', state: 'Tamil Nadu', region: 'Kaveri', latitude: 11.8, longitude: 77.8 }
];

// Reservoir levels (0-100)
const damReservoirLevels = {};
dams.forEach(d => damReservoirLevels[d.id] = 40 + Math.random() * 40);

// Regional synthetic baselines
const rainfallByRegion = {
  'Narmada': { low: 10, high: 35, avg: 22 },
  'Sutlej': { low: 8, high: 30, avg: 18 },
  'Bhagirathi': { low: 20, high: 50, avg: 35 },
  'Kaveri': { low: 5, high: 20, avg: 12 },
  'Damodar': { low: 15, high: 40, avg: 27 },
  'Periyar': { low: 25, high: 60, avg: 42 },
  'Koyna': { low: 18, high: 45, avg: 31 }
};

const earthquakesByRegion = {
  'Narmada': { count: 0, magnitude: 0 },
  'Sutlej': { count: 1, magnitude: 3.2 },
  'Bhagirathi': { count: 3, magnitude: 4.1 },
  'Kaveri': { count: 0, magnitude: 0 },
  'Damodar': { count: 1, magnitude: 3.0 },
  'Periyar': { count: 0, magnitude: 0 },
  'Koyna': { count: 2, magnitude: 3.6 }
};

function clamp(v, a=0, b=100){ return Math.max(a, Math.min(b, v)); }

// --- Live fetch helpers with fallbacks ---
async function fetchOpenMeteo(lat, lon, days = 7){
  try{
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - (days-1));
    const fmt = d => d.toISOString().slice(0,10);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&start_date=${fmt(start)}&end_date=${fmt(end)}&timezone=UTC`;
    const r = await fetch(url, { timeout: 10000 });
    const j = await r.json();
    const arr = j && j.daily && j.daily.precipitation_sum ? j.daily.precipitation_sum : null;
    return { ok: !!arr, daily: arr };
  }catch(e){ return { ok:false, error: e.message } }
}

async function fetchNASA(lat, lon, days = 30){
  try{
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - (days-1));
    const fmt = d => d.toISOString().slice(0,10).replace(/-/g,'');
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOT&start=${fmt(start)}&end=${fmt(end)}&latitude=${lat}&longitude=${lon}&format=JSON`;
    const r = await fetch(url, { timeout: 10000 });
    const j = await r.json();
    const values = j && j.properties && j.properties.parameter && j.properties.parameter.PRECTOT ? Object.values(j.properties.parameter.PRECTOT).map(Number) : null;
    return { ok: !!values, daily: values };
  }catch(e){ return { ok:false, error: e.message } }
}

async function fetchUSGS(lat, lon, days = 30){
  try{
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - days);
    const fmt = d => d.toISOString().slice(0,10);
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${fmt(start)}&endtime=${fmt(end)}&latitude=${lat}&longitude=${lon}&maxradiuskm=200`;
    const r = await fetch(url, { timeout: 10000 });
    const j = await r.json();
    const mags = j && j.features ? j.features.map(f => f.properties && f.properties.mag).filter(v => typeof v === 'number') : [];
    return { ok: true, count: mags.length, maxMag: mags.length ? Math.max(...mags) : 0 };
  }catch(e){ return { ok:false, error: e.message, count:0, maxMag:0 } }
}

// --- Risk computation ---
function computeRiskForDam(d, env = {}){
  const rainfallData = rainfallByRegion[d.region] || { low: 5, high: 30, avg: 15 };
  const reservoirLevel = typeof env.reservoir === 'number' ? env.reservoir : (damReservoirLevels[d.id] || 50);

  const openAvg = Array.isArray(env.openMeteo) && env.openMeteo.length ? env.openMeteo.reduce((a,b)=>a+(b||0),0)/env.openMeteo.length : rainfallData.avg;
  const nasaAvg = Array.isArray(env.nasa) && env.nasa.length ? env.nasa.reduce((a,b)=>a+(b||0),0)/env.nasa.length : rainfallData.avg;
  const combinedRainfall = openAvg * 0.5 + nasaAvg * 0.3 + (reservoirLevel/100 * rainfallData.high) * 0.2;

  const rainfallTrend = combinedRainfall * (0.9 + Math.random()*0.3);
  const soilMoisture = clamp(40 + combinedRainfall * 0.7 + Math.random()*15, 0, 100);
  const slopeStability = clamp(90 - soilMoisture * 0.4 + Math.random()*10, 0, 100);
  const earthquakeIntensity = env.usgs && env.usgs.maxMag ? env.usgs.maxMag : (earthquakesByRegion[d.region] && earthquakesByRegion[d.region].magnitude) || 0;

  const reservoirFactor = reservoirLevel / 100;
  const combinedNormRain = combinedRainfall / (rainfallData.high || 1);
  const floodScoreRaw = reservoirFactor * 0.30 + combinedNormRain * 0.40 + (rainfallTrend / (rainfallData.high || 1)) * 0.20 + reservoirFactor * 0.10;
  const floodScore = clamp(Math.round(floodScoreRaw * 100), 0, 100);
  const floodLevel = floodScore >= 75 ? 'HIGH' : floodScore >= 50 ? 'MEDIUM' : 'LOW';

  const landslideRaw = (soilMoisture / 100) * 0.35 + ((100 - slopeStability) / 100) * 0.25 + (earthquakeIntensity / 8) * 0.25 + combinedNormRain * 0.15;
  const landslideScore = clamp(Math.round(landslideRaw * 100), 0, 100);
  const landslideLevel = landslideScore >= 70 ? 'HIGH' : landslideScore >= 45 ? 'MEDIUM' : 'LOW';

  return {
    damId: d.id,
    damName: d.name,
    state: d.state,
    region: d.region,
    floodRisk: { score: floodScore, level: floodLevel, components: { reservoirLevel: +reservoirLevel.toFixed(1), combinedRainfall: +combinedRainfall.toFixed(2) } },
    landslideRisk: { score: landslideScore, level: landslideLevel, components: { soilMoisture: +soilMoisture.toFixed(1), slopeStability: +slopeStability.toFixed(1) } },
    overallRisk: Math.round((floodScore + landslideScore)/2)
  };
}

// --- Endpoints ---
app.get('/api/health', (req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));

app.get('/api/data/dams', (req, res) => res.json({ dams, total: dams.length, ts: new Date().toISOString() }));

app.get('/api/data/reservoirs', (req, res) => {
  // small random walk update
  Object.keys(damReservoirLevels).forEach(k => damReservoirLevels[k] = clamp(damReservoirLevels[k] + (Math.random()-0.45)*3, 10, 98));
  res.json({ dams: dams.map(d => ({ ...d, level: +damReservoirLevels[d.id].toFixed(1), trend: damReservoirLevels[d.id] > 70 ? 'Rising' : damReservoirLevels[d.id] < 40 ? 'Falling' : 'Stable' })) });
});

app.get('/api/data/rainfall', async (req, res) => {
  const lat = parseFloat(req.query.latitude) || dams[0].latitude;
  const lon = parseFloat(req.query.longitude) || dams[0].longitude;
  const [om, nas] = await Promise.all([fetchOpenMeteo(lat, lon, 7), fetchNASA(lat, lon, 30)]);
  const synthetic = (()=>{ const r = rainfallByRegion[dams[0].region]; return Array.from({length:7}, ()=>Math.random()*(r.high-r.low)+r.low); })();
  res.json({ location:{ latitude: lat, longitude: lon }, openMeteo: om.ok ? om.daily : synthetic, nasa: nas.ok ? nas.daily.slice(-7) : synthetic });
});

app.get('/api/data/earthquakes', async (req, res) => {
  const lat = parseFloat(req.query.latitude) || dams[0].latitude;
  const lon = parseFloat(req.query.longitude) || dams[0].longitude;
  const usgs = await fetchUSGS(lat, lon, 30);
  res.json({ count: usgs.count || 0, maxMag: usgs.maxMag || 0 });
});

app.get('/api/risk/all', async (req, res) => {
  // For speed, compute with synthetic/backfill data quickly
  const results = dams.map(d => computeRiskForDam(d));
  res.json({ risks: results, ts: new Date().toISOString() });
});

app.post('/api/risk/calculate', async (req, res) => {
  try{
    const damId = req.body.damId;
    if (!damId) return res.status(400).json({ error: 'damId required' });
    const dam = dams.find(x=>x.id===damId);
    if (!dam) return res.status(404).json({ error: 'Dam not found' });

    // fetch environmental signals in parallel
    const [om, nas, usgs] = await Promise.all([fetchOpenMeteo(dam.latitude, dam.longitude, 7), fetchNASA(dam.latitude, dam.longitude, 30), fetchUSGS(dam.latitude, dam.longitude, 30)]);
    const env = {
      openMeteo: om.ok ? om.daily : null,
      nasa: nas.ok ? nas.daily : null,
      usgs: usgs.ok ? usgs : { count:0, maxMag:0 },
      reservoir: damReservoirLevels[dam.id]
    };

    // fallback synthetic arrays where missing
    if (!env.openMeteo) env.openMeteo = Array.from({length:7}, ()=>Math.random()*(rainfallByRegion[dam.region].high - rainfallByRegion[dam.region].low) + rainfallByRegion[dam.region].low);
    if (!env.nasa) env.nasa = Array.from({length:7}, ()=>Math.random()*(rainfallByRegion[dam.region].high - rainfallByRegion[dam.region].low) + rainfallByRegion[dam.region].low);

    const risk = computeRiskForDam(dam, { openMeteo: env.openMeteo, nasa: env.nasa, usgs: env.usgs, reservoir: env.reservoir });

    const response = {
      damId: dam.id,
      damName: dam.name,
      state: dam.state,
      region: dam.region,
      timestamp: new Date().toISOString(),
      environmentalData: { openMeteo: env.openMeteo.slice(-7), nasa: env.nasa.slice(-7), usgs: env.usgs, reservoir: { level: +env.reservoir.toFixed(1) } },
      floodRisk: {
        current: { score: risk.floodRisk.score, level: risk.floodRisk.level },
        prediction24h: { predicted24h: clamp(risk.floodRisk.score + (Math.random()*12 - 6)), confidence: 80 }
      },
      landslideRisk: {
        current: { score: risk.landslideRisk.score, level: risk.landslideRisk.level },
        prediction24h: { predicted24h: clamp(risk.landslideRisk.score + (Math.random()*12 - 6)), confidence: 75 }
      }
    };

    res.json(response);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

app.get('/api/risk/alerts', (req, res) => {
  const alerts = [];
  dams.forEach(dam => {
    const r = rainfallByRegion[dam.region] || { low: 5, high: 30 };
    const reservoir = damReservoirLevels[dam.id] || 50;
    const rainfall = Math.random() * (r.high - r.low) + r.low;
    if (reservoir > 85 || rainfall > r.high * 0.8) alerts.push({ id: `alert-flood-${dam.id}`, severity: 'HIGH', type: 'FLOOD_WARNING', message: `Reservoir ${reservoir.toFixed(0)}% - Rain ${rainfall.toFixed(1)}mm`, location: `${dam.name}, ${dam.state}`, state: dam.state, region: dam.region, dam: dam.name, score: Math.round(60 + Math.random()*40), timestamp: new Date().toISOString() });
    else if (reservoir > 70 || rainfall > r.high * 0.5) alerts.push({ id: `alert-medium-${dam.id}`, severity: 'MEDIUM', type: 'RAINFALL_WARNING', message: `Moderate rainfall in ${dam.region}`, location: `${dam.name}, ${dam.state}`, state: dam.state, region: dam.region, dam: dam.name, score: Math.round(40 + Math.random()*30), timestamp: new Date().toISOString() });
    const eq = earthquakesByRegion[dam.region] || { count: 0, magnitude: 0 };
    if (eq.count > 0 && eq.magnitude > 3.5) alerts.push({ id: `alert-eq-${dam.id}`, severity: 'MEDIUM', type: 'SEISMIC_ACTIVITY', message: `Seismic events: ${eq.count}, M ${eq.magnitude}`, location: `${dam.name}, ${dam.state}`, state: dam.state, region: dam.region, dam: dam.name, score: Math.round(30 + Math.random()*25), timestamp: new Date().toISOString() });
  });
  if (alerts.length === 0) alerts.push({ id: 'alert-info-1', severity: 'LOW', type: 'SYSTEM_INFO', message: 'System monitoring active', location: 'All Regions', state: 'National', region: 'Pan-India', dam: 'Multiple', score: 10, timestamp: new Date().toISOString() });
  res.json({ alerts: alerts.slice(0, 20) });
});

app.get('/api/risk/distribution', (req, res) => {
  const risks = dams.map(d => computeRiskForDam(d));
  res.json({
    floodRiskDistribution: { HIGH: risks.filter(r=>r.floodRisk.level==='HIGH').length, MEDIUM: risks.filter(r=>r.floodRisk.level==='MEDIUM').length, LOW: risks.filter(r=>r.floodRisk.level==='LOW').length },
    landslideRiskDistribution: { HIGH: risks.filter(r=>r.landslideRisk.level==='HIGH').length, MEDIUM: risks.filter(r=>r.landslideRisk.level==='MEDIUM').length, LOW: risks.filter(r=>r.landslideRisk.level==='LOW').length }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Mock Backend running on http://localhost:${PORT}`);
  console.log(`📊 ${dams.length} dams monitored`);
});

server.on('error', err => { console.error('Server error:', err); process.exit(1); });
