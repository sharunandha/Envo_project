import React, { useState, useEffect, useCallback } from 'react';
import { Header, Drawer, Footer } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MapComponent } from './components/Map';
import { RiskDetailsPanel, AlertsPanel } from './components/RiskPanel';
import { RainfallChart, RiskTrendChart, ReservoirChart } from './components/Charts';
import { LoadingSpinner, ErrorAlert } from './components/Common';
import { dataAPI, riskAPI } from './services/api';
import './index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDam, setSelectedDam] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data states
  const [dams, setDams] = useState([]);
  const [risks, setRisks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rainfallData, setRainfallData] = useState(null);
  const [reservoirData, setReservoirData] = useState([]);
  const [selectedRiskData, setSelectedRiskData] = useState(null);

  // Fetch all data — all from live APIs
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [damsRes, risksRes, alertsRes, reservoirsRes] = await Promise.all([
        dataAPI.getDamLocations(),
        riskAPI.getAllRisks(),
        riskAPI.getAlerts(),
        dataAPI.getReservoirLevels(),
      ]);

      setDams(damsRes.data.dams || []);
      setRisks(risksRes.data.risks || []);
      setAlerts(alertsRes.data.alerts || []);
      setReservoirData(reservoirsRes.data.dams || []);
      setLastUpdated(new Date().toISOString());

      // Select first dam by default
      if (damsRes.data.dams?.length > 0 && !selectedDam) {
        setSelectedDam(damsRes.data.dams[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch live data. Retrying...');
    } finally {
      setLoading(false);
    }
  }, [selectedDam]);

  // Fetch detailed risk data for selected dam
  const fetchDamRiskDetails = useCallback(async (damId) => {
    if (!damId) return;
    try {
      const response = await riskAPI.calculateRisk(damId);
      setSelectedRiskData(response.data);
    } catch (err) {
      console.error('Error fetching dam details:', err);
    }
  }, []);

  // Fetch rainfall data for selected dam
  const fetchRainfallForDam = useCallback(async (damId) => {
    if (!damId) return;
    try {
      const dam = dams.find(d => d.id === damId);
      if (!dam) return;
      const response = await dataAPI.getRainfallData(dam.latitude, dam.longitude);
      setRainfallData(response.data);
    } catch (err) {
      console.error('Error fetching rainfall data:', err);
    }
  }, [dams]);

  // Initial load
  useEffect(() => { fetchData(); }, []);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchData(), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch details when dam selection changes
  useEffect(() => {
    if (selectedDam) {
      fetchDamRiskDetails(selectedDam);
      fetchRainfallForDam(selectedDam);
    }
  }, [selectedDam, fetchDamRiskDetails, fetchRainfallForDam]);

  const filteredDams = selectedRegion ? dams.filter(d => d.state === selectedRegion) : dams;
  const filteredRisks = selectedRegion ? risks.filter(r => r.dam?.state === selectedRegion) : risks;

  // ── Rainfall: combine forecast + historical (historical has real observed data) ──
  const forecastSum = rainfallData?.forecast?.daily?.precipitation_sum
    ? rainfallData.forecast.daily.precipitation_sum.reduce((s, v) => s + (v || 0), 0) : 0;
  const historicalSum = rainfallData?.historical?.daily?.precipitation_sum
    ? rainfallData.historical.daily.precipitation_sum.reduce((s, v) => s + (v || 0), 0) : 0;
  const totalRainfall7d = +(forecastSum + historicalSum).toFixed(1);

  const earthquakesCount = selectedRiskData?.environmentalData?.earthquakes?.recentCount || 0;

  // ── Get currently selected dam info ──
  const currentDam = dams.find(d => d.id === selectedDam);
  const currentDamName = currentDam?.name || 'Select a Dam';

  // ── 24h Prediction: find dams at risk based on real risk scores ──
  const damsAtRisk24h = risks
    .filter(r => {
      const floodScore = r.floodScore || 0;
      const lsScore = r.landslideScore || 0;
      return floodScore >= 35 || lsScore >= 35;
    })
    .sort((a, b) => Math.max(b.floodScore || 0, b.landslideScore || 0) - Math.max(a.floodScore || 0, a.landslideScore || 0))
    .slice(0, 8);

  if (loading && dams.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center animate-fadeIn">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-700 font-medium">Fetching live data for 50+ dams across India...</p>
          <p className="mt-2 text-xs text-gray-500">First load may take 30-60 seconds (calling Open-Meteo, NASA, USGS, GloFAS for each dam)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={fetchData}
        isLoading={loading}
        currentView={currentView}
        onViewChange={setCurrentView}
        onMenuToggle={() => setDrawerOpen(!drawerOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          regions={[...new Set(dams.map(d => d.state))]}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          dams={filteredDams}
          selectedDam={selectedDam}
          onDamSelect={setSelectedDam}
        />

        <div className="flex-1 overflow-auto flex flex-col w-full">
          <div className="flex-1 overflow-auto">
            <div className="p-3 sm:p-4 md:p-8 w-full max-w-full">
              {error && (
                <div className="mb-4 animate-slideDown">
                  <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
              )}

              {/* ════════ DASHBOARD VIEW ════════ */}
              {currentView === 'dashboard' && (
                <div className="space-y-4 md:space-y-6 animate-fadeIn">
                  <h2 className="text-xl md:text-3xl font-bold text-gray-900">📊 Dashboard</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2">
                      <Dashboard
                        totalDams={filteredDams.length}
                        highRiskZones={filteredRisks.filter(r => r.floodRisk === 'HIGH').length}
                        totalRainfall7d={totalRainfall7d}
                        earthquakesLast24h={earthquakesCount}
                        risks={filteredRisks}
                        alerts={alerts}
                        damsAtRisk24h={damsAtRisk24h}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-slideUp">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">🚨 Active Alerts</h3>
                        <div className="max-h-96 overflow-y-auto space-y-3">
                          {alerts.filter(a => a.severity === 'HIGH' || a.severity === 'MEDIUM').length > 0 ? (
                            <AlertsPanel alerts={alerts.filter(a => a.severity === 'HIGH' || a.severity === 'MEDIUM').slice(0, 5)} />
                          ) : (
                            <p className="text-gray-600 text-sm">No active alerts</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ MAP VIEW ════════ */}
              {currentView === 'map' && (
                <div className="space-y-4 md:space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-xl md:text-3xl font-bold text-gray-900">🗺️ Risk Map</h2>
                    <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                      <span className="text-sm font-semibold text-blue-800">Viewing: {currentDamName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="lg:col-span-3">
                      <div className="bg-white border border-gray-200 rounded-xl p-2 md:p-4 shadow-sm overflow-hidden" style={{ height: 'clamp(300px, 55vh, 650px)' }}>
                        <MapComponent
                          dams={filteredDams}
                          risks={filteredRisks}
                          selectedDam={selectedDam}
                          onDamSelect={setSelectedDam}
                        />
                      </div>
                    </div>
                    <div className="max-h-72 md:max-h-full overflow-y-auto">
                      <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
                        <RiskDetailsPanel
                          riskData={selectedRiskData}
                          dam={currentDam}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ CHARTS VIEW ════════ */}
              {currentView === 'charts' && (
                <div className="space-y-4 md:space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-xl md:text-3xl font-bold text-gray-900">📈 Analytics</h2>
                    <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                      <span className="text-sm font-semibold text-blue-800">Viewing: {currentDamName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-slideUp">
                      <h3 className="text-lg font-bold mb-1 text-gray-900">📊 Rainfall — {currentDamName}</h3>
                      <p className="text-xs text-gray-500 mb-4">Forecast (next 7d) + Historical (past 7d)</p>
                      <div className="max-h-80 overflow-auto">
                        {rainfallData ? (
                          <RainfallChart data={rainfallData} damName={currentDamName} />
                        ) : (
                          <p className="text-gray-600 text-sm">Select a dam from the menu.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-slideUp">
                      <h3 className="text-lg font-bold mb-1 text-gray-900">📈 Risk Trend — {currentDamName}</h3>
                      <p className="text-xs text-gray-500 mb-4">Past 24h → Now → Next 24h prediction</p>
                      <div className="max-h-80 overflow-auto">
                        {selectedRiskData ? (
                          <RiskTrendChart
                            floodRisks={selectedRiskData.floodRisk}
                            landslideRisks={selectedRiskData.landslideRisk}
                            environmentalData={selectedRiskData.environmentalData}
                          />
                        ) : (
                          <p className="text-gray-600 text-sm">Select a dam to view trends</p>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-slideUp">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">💧 Reservoir Levels</h3>
                        <span className="text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium border border-green-200">Live Data</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Estimated from seasonal baseline + live 7-day rainfall (Open-Meteo) + river discharge (GloFAS) + soil moisture.
                      </p>
                      <div style={{ minHeight: '420px' }}>
                        {reservoirData.length > 0 ? (
                          <ReservoirChart reservoirs={reservoirData} />
                        ) : (
                          <p className="text-gray-600 text-sm">No reservoir data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default App;
