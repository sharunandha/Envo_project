import React from 'react';
import { InfoCard } from './Common';

export const Dashboard = ({
  totalDams,
  highRiskZones,
  totalRainfall7d,
  earthquakesLast24h,
  risks,
  alerts,
  damsAtRisk24h
}) => {
  const highRiskCount = risks?.filter(r => r.floodRisk === 'HIGH' || r.landslideRisk === 'HIGH').length || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Live Data Badge */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 animate-slideUp">
        <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-sm font-medium text-green-800">Live Data</span>
        <span className="text-xs text-green-600 ml-2">Open-Meteo &bull; NASA POWER &bull; USGS &bull; GloFAS</span>
      </div>

      {/* ⚡ 24-Hour Flood & Landslide Prediction */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-5 shadow-lg text-white animate-fadeIn">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚡</span>
          <h3 className="text-lg font-bold">24-Hour Flood & Landslide Prediction</h3>
          <span className="ml-auto text-xs bg-white/20 rounded-full px-3 py-1">Real-Time AI Analysis</span>
        </div>
        {damsAtRisk24h && damsAtRisk24h.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {damsAtRisk24h.map((r, idx) => {
              const floodHigh = (r.floodScore || 0) >= 60;
              const lsHigh = (r.landslideScore || 0) >= 60;
              const floodMed = (r.floodScore || 0) >= 35;
              const lsMed = (r.landslideScore || 0) >= 35;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-bold text-sm">{r.dam?.name || 'Unknown Dam'}</p>
                    <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5">{r.dam?.state}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(floodHigh || floodMed) && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${floodHigh ? 'bg-red-500/80 text-white' : 'bg-amber-400/80 text-gray-900'}`}>
                        🌊 Flood {(r.floodScore || 0).toFixed(0)}%
                      </span>
                    )}
                    {(lsHigh || lsMed) && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${lsHigh ? 'bg-red-500/80 text-white' : 'bg-amber-400/80 text-gray-900'}`}>
                        ⛰️ Landslide {(r.landslideScore || 0).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-green-200 font-medium">✅ No dams at significant risk in the next 24 hours</p>
            <p className="text-xs text-white/60 mt-1">All monitored dams are below the 35% risk threshold</p>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <InfoCard
          icon="🗺️"
          title="Monitored Dams"
          value={totalDams}
          color="blue"
        />
        <InfoCard
          icon="⚠️"
          title="High Risk Zones"
          value={highRiskCount}
          color={highRiskCount > 0 ? 'red' : 'green'}
        />
        <InfoCard
          icon="💧"
          title="7-Day Rainfall"
          value={totalRainfall7d?.toFixed(1)}
          unit="mm (cumulative)"
          color="blue"
        />
        <InfoCard
          icon="📍"
          title="Earthquakes (30d)"
          value={earthquakesLast24h}
          color="amber"
        />
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm animate-slideUp">
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Status Overview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {risks && risks.length > 0 && (
            <>
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-2xl font-bold text-green-600">
                  {risks.filter(r => r.floodRisk === 'LOW').length}
                </p>
                <p className="text-xs text-green-700 mt-1 font-medium">Low Flood Risk</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-2xl font-bold text-amber-600">
                  {risks.filter(r => r.floodRisk === 'MEDIUM').length}
                </p>
                <p className="text-xs text-amber-700 mt-1 font-medium">Medium Flood Risk</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-2xl font-bold text-red-600">
                  {risks.filter(r => r.floodRisk === 'HIGH').length}
                </p>
                <p className="text-xs text-red-700 mt-1 font-medium">High Flood Risk</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alert Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm animate-slideUp">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Alert Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-3xl font-bold text-red-600">
              {alerts?.filter(a => a.severity === 'HIGH').length || 0}
            </p>
            <p className="text-sm text-red-700 mt-1 font-medium">Critical Alerts</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-3xl font-bold text-amber-600">
              {alerts?.filter(a => a.severity === 'MEDIUM').length || 0}
            </p>
            <p className="text-sm text-amber-700 mt-1 font-medium">Warning Alerts</p>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-slideUp">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Risk by Type</h3>
        
        <div className="space-y-4">
          {/* Flood Risk */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Flood Risk</span>
              <span className="text-xs text-gray-500">
                {risks?.filter(r => r.floodRisk === 'HIGH').length} High · {risks?.filter(r => r.floodRisk === 'MEDIUM').length} Med · {risks?.filter(r => r.floodRisk === 'LOW').length} Low
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
              {risks?.length > 0 && (
                <>
                  <div
                    className="bg-red-500 h-3 transition-all"
                    style={{ width: `${(risks.filter(r => r.floodRisk === 'HIGH').length / risks.length) * 100}%` }}
                  ></div>
                  <div
                    className="bg-amber-400 h-3 transition-all"
                    style={{ width: `${(risks.filter(r => r.floodRisk === 'MEDIUM').length / risks.length) * 100}%` }}
                  ></div>
                  <div
                    className="bg-green-500 h-3 transition-all"
                    style={{ width: `${(risks.filter(r => r.floodRisk === 'LOW').length / risks.length) * 100}%` }}
                  ></div>
                </>
              )}
            </div>
          </div>

          {/* Landslide Risk */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Landslide Risk</span>
              <span className="text-xs text-gray-500">
                {risks?.filter(r => r.landslideRisk === 'HIGH').length} High · {risks?.filter(r => r.landslideRisk === 'MEDIUM').length} Med · {risks?.filter(r => r.landslideRisk === 'LOW').length} Low
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
              {risks?.length > 0 && (
                <>
                  <div
                    className="bg-red-500 h-3 transition-all"
                    style={{ width: `${(risks.filter(r => r.landslideRisk === 'HIGH').length / risks.length) * 100}%` }}
                  ></div>
                  <div
                    className="bg-amber-400 h-3 transition-all"
                    style={{ width: `${(risks.filter(r => r.landslideRisk === 'MEDIUM').length / risks.length) * 100}%` }}
                  ></div>
                  <div
                    className="bg-green-500 h-3 transition-all"
                    style={{ width: `${(risks.filter(r => r.landslideRisk === 'LOW').length / risks.length) * 100}%` }}
                  ></div>
                </>
              )}
            </div>
          </div>

          {/* Average Risk Scores */}
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xl font-bold text-blue-700">
                {risks?.length > 0 ? (risks.reduce((s, r) => s + (r.floodScore || 0), 0) / risks.length).toFixed(0) : 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">Avg Flood Score</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-xl font-bold text-orange-700">
                {risks?.length > 0 ? (risks.reduce((s, r) => s + (r.landslideScore || 0), 0) / risks.length).toFixed(0) : 0}
              </p>
              <p className="text-xs text-orange-600 mt-1">Avg Landslide Score</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span> High (&gt;60)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block"></span> Medium (30-60)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Low (&lt;30)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
