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
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch details when dam selection changes
  useEffect(() => {
    if (selectedDam) {
      fetchDamRiskDetails(selectedDam);
      fetchRainfallForDam(selectedDam);
    }
  }, [selectedDam, fetchDamRiskDetails, fetchRainfallForDam]);

  const filteredDams = selectedRegion
    ? dams.filter(d => d.state === selectedRegion)
    : dams;

  const filteredRisks = selectedRegion
    ? risks.filter(r => r.dam?.state === selectedRegion)
    : risks;

  const avgRainfall = rainfallData?.forecast?.daily?.precipitation_sum
    ? +(rainfallData.forecast.daily.precipitation_sum.reduce((s, v) => s + (v || 0), 0) / rainfallData.forecast.daily.precipitation_sum.length).toFixed(1)
    : 0;
  const earthquakesCount = selectedRiskData?.environmentalData?.earthquakes?.recentCount || 0;

  if (loading && dams.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Fetching live data for 50+ dams across India...</p>
          <p className="mt-2 text-xs text-gray-400">First load may take 30-60 seconds (calling Open-Meteo, NASA, USGS, GloFAS for each dam)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header with integrated navigation */}
      <Header 
        lastUpdated={lastUpdated} 
        onRefresh={fetchData} 
        isLoading={loading}
        currentView={currentView}
        onViewChange={setCurrentView}
        onMenuToggle={() => setDrawerOpen(!drawerOpen)}
      />

      {/* Main layout - Drawer + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Drawer */}
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

        {/* Content Area - Full width when drawer is closed */}
        <div className="flex-1 overflow-auto flex flex-col w-full">
          <div className="flex-1 overflow-auto">
            <div className="p-3 sm:p-4 md:p-8 w-full max-w-full">
              {error && (
                <div className="mb-4">
                  <ErrorAlert
                    message={error}
                    onClose={() => setError(null)}
                  />
                </div>
              )}

              {/* Dashboard View */}
              {currentView === 'dashboard' && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-xl md:text-3xl font-bold text-gray-900">📊 Dashboard</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2">
                      <Dashboard
                        totalDams={filteredDams.length}
                        highRiskZones={filteredRisks.filter(r => r.floodRisk === 'HIGH').length}
                        avgRainfall={avgRainfall}
                        earthquakesLast24h={earthquakesCount}
                        risks={filteredRisks}
                        alerts={alerts}
                      />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-bold mb-4 text-gray-900">🚨 Active Alerts</h3>
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {alerts.length > 0 ? (
                          <AlertsPanel alerts={alerts.slice(0, 5)} />
                        ) : (
                          <p className="text-gray-600 text-sm">No active alerts</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Map View */}
              {currentView === 'map' && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-xl md:text-3xl font-bold text-gray-900">🗺️ Risk Map</h2>
                  <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="lg:col-span-3">
                      <div className="bg-white border border-gray-200 rounded-lg p-2 md:p-4 shadow-sm overflow-hidden" style={{ height: 'clamp(300px, 50vh, 600px)' }}>
                        <MapComponent
                          dams={filteredDams}
                          risks={filteredRisks}
                          selectedDam={selectedDam}
                          onDamSelect={setSelectedDam}
                        />
                      </div>
                    </div>
                    <div className="max-h-72 md:max-h-full overflow-y-auto">
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
                        <RiskDetailsPanel 
                          riskData={selectedRiskData} 
                          dam={dams.find(d => d.id === selectedDam)} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts/Analytics View */}
              {currentView === 'charts' && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-xl md:text-3xl font-bold text-gray-900">📈 Analytics</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Rainfall Data */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-bold mb-4 text-gray-900">📊 Rainfall Forecast</h3>
                      <div className="max-h-80 overflow-auto">
                        {rainfallData ? (
                          <RainfallChart data={rainfallData.forecast} />
                        ) : (
                          <p className="text-gray-600 text-sm">No rainfall data available. Select a dam from the menu.</p>
                        )}
                      </div>
                    </div>

                    {/* Risk Trend */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-bold mb-4 text-gray-900">📈 Risk Trend (±24h)</h3>
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

                    {/* Reservoir Levels — Full width, large chart */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">💧 Reservoir Levels</h3>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Live Data</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Estimated from seasonal baseline + live 7-day rainfall (Open-Meteo) + river discharge (GloFAS) + soil moisture.
                        India's CWC does not provide a free public API, so levels are derived from multiple environmental indicators.
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

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default App;
