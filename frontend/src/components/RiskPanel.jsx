import React from 'react';
import { Badge, RiskGauge } from './Common';
import { formatDate } from '../utils/helpers';

export const RiskDetailsPanel = ({ riskData, dam }) => {
  if (!riskData || !dam) {
    return (
      <div className="text-gray-600 text-center py-8 text-sm">
        <p>Select a dam to view risk details</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dam Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">{dam?.name}</h3>
        <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
          <div>
            <p className="text-gray-600">State</p>
            <p className="text-gray-900 font-semibold">{dam?.state}</p>
          </div>
          <div>
            <p className="text-gray-600">River</p>
            <p className="text-gray-900 font-semibold">{dam?.river}</p>
          </div>
          <div>
            <p className="text-gray-600">Capacity</p>
            <p className="text-gray-900 font-semibold">{typeof dam?.capacity === 'number' ? dam.capacity.toFixed(2) : 'N/A'} BCM</p>
          </div>
          <div>
            <p className="text-gray-600">Updated</p>
            <p className="text-gray-900 font-semibold text-xs">{formatDate(riskData.timestamp)}</p>
          </div>
        </div>
      </div>

      {/* Flood Risk */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-gray-900">🌊 Flood Risk</h4>
          <Badge level={riskData.floodRisk?.current?.level || 'LOW'} />
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4">
          <RiskGauge score={riskData.floodRisk?.current?.score} label="Current Risk" />
          <RiskGauge score={riskData.floodRisk?.prediction24h?.predicted24h} label="24h Prediction" />
        </div>

        <div className="text-sm space-y-2">
          <p className="text-gray-700 font-semibold">Risk Factors:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            {riskData.floodRisk?.current?.factors?.map((factor, idx) => (
              <li key={idx} className="text-xs">{factor}</li>
            ))}
          </ul>
        </div>

        {riskData.environmentalData && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
            <p className="text-gray-700 font-semibold mb-2">Environmental Data (Live):</p>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>
                <p className="text-xs text-gray-600">Rainfall Forecast</p>
                <p className="text-gray-900 font-semibold">{typeof riskData.environmentalData.rainfall?.forecast === 'number' ? riskData.environmentalData.rainfall.forecast.toFixed(1) : 'N/A'}mm</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">7-Day Accumulation</p>
                <p className="text-gray-900 font-semibold">{typeof riskData.environmentalData.rainfall?.accumulation === 'number' ? riskData.environmentalData.rainfall.accumulation.toFixed(1) : 'N/A'}mm</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Reservoir Level</p>
                <p className="text-gray-900 font-semibold">{typeof riskData.environmentalData.reservoir?.level === 'number' ? riskData.environmentalData.reservoir.level.toFixed(1) : 'N/A'}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">River Discharge</p>
                <p className="text-gray-900 font-semibold">{typeof riskData.environmentalData.reservoir?.riverDischarge === 'number' ? riskData.environmentalData.reservoir.riverDischarge.toFixed(1) : 'N/A'} m³/s</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Trend</p>
                <p className="text-gray-900 font-semibold">{riskData.environmentalData.reservoir?.trend || 'N/A'}</p>
              </div>
              {riskData.environmentalData.rainfall?.nasaAvg !== undefined && (
                <div>
                  <p className="text-xs text-gray-600">NASA Sat. Avg</p>
                  <p className="text-gray-900 font-semibold">{riskData.environmentalData.rainfall.nasaAvg.toFixed(1)} mm/d</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Landslide Risk */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-gray-900">⛰️ Landslide Risk</h4>
          <Badge level={riskData.landslideRisk?.current?.level || 'LOW'} />
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4">
          <RiskGauge score={riskData.landslideRisk?.current?.score} label="Current Risk" />
          <RiskGauge score={riskData.landslideRisk?.prediction24h?.predicted24h} label="24h Prediction" />
        </div>

        <div className="text-sm space-y-2">
          <p className="text-gray-700 font-semibold">Risk Factors:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            {riskData.landslideRisk?.current?.factors?.map((factor, idx) => (
              <li key={idx} className="text-xs">{factor}</li>
            ))}
          </ul>
        </div>

        {riskData.environmentalData && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
            <p className="text-gray-700 font-semibold mb-2">Seismic & Soil Data (Live):</p>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>
                <p className="text-xs text-gray-600">Earthquakes (30d)</p>
                <p className="text-gray-900 font-semibold">{riskData.environmentalData.earthquakes?.recentCount ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Max Magnitude</p>
                <p className="text-gray-900 font-semibold">{typeof riskData.environmentalData.earthquakes?.maxMagnitude === 'number' ? riskData.environmentalData.earthquakes.maxMagnitude.toFixed(1) : 'N/A'}</p>
              </div>
              {riskData.environmentalData.soil && (
                <>
                  <div>
                    <p className="text-xs text-gray-600">Surface Soil Moisture</p>
                    <p className="text-gray-900 font-semibold">{typeof riskData.environmentalData.soil.surfaceMoisture === 'number' ? (riskData.environmentalData.soil.surfaceMoisture * 100).toFixed(1) + '% vol.' : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Deep Soil Moisture</p>
                    <p className="text-gray-900 font-semibold">{typeof riskData.environmentalData.soil.deepMoisture === 'number' ? (riskData.environmentalData.soil.deepMoisture * 100).toFixed(1) + '% vol.' : 'N/A'}</p>
                  </div>
                </>
              )}
            </div>

            {/* Earthquake Event Details */}
            {riskData.environmentalData.earthquakes?.events?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">📍 Recent Earthquake Events:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {riskData.environmentalData.earthquakes.events.map((eq, idx) => {
                    const eqDate = new Date(eq.time);
                    const istStr = eqDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                    return (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${eq.magnitude >= 4.5 ? 'text-red-600' : eq.magnitude >= 3.5 ? 'text-amber-600' : 'text-gray-700'}`}>
                            M{eq.magnitude?.toFixed(1)}
                          </span>
                          <span className="text-gray-500">{istStr} IST</span>
                        </div>
                        <p className="text-gray-600 mt-0.5">📌 {eq.place || 'Unknown location'}</p>
                        <div className="flex gap-3 mt-0.5 text-gray-400">
                          <span>Depth: {eq.depth?.toFixed(1)} km</span>
                          <span>Distance: {eq.distance?.toFixed(0)} km</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Sources */}
        {riskData.dataSources && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400">Sources: {riskData.dataSources.join(' • ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AlertsPanel = ({ alerts, onRefresh }) => {
  // Filter out INFO/LOW severity alerts - only show HIGH and MEDIUM
  const actionableAlerts = (alerts || []).filter(a => a.severity === 'HIGH' || a.severity === 'MEDIUM');

  if (!actionableAlerts || actionableAlerts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
        <p className="text-gray-700">✓ No active alerts</p>
        <p className="text-xs text-gray-500 mt-2">All systems functioning normally</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actionableAlerts.map(alert => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg border-l-4 ${
            alert.severity === 'HIGH'
              ? 'bg-red-50 border-red-500'
              : 'bg-amber-50 border-amber-500'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`font-bold text-sm ${alert.severity === 'HIGH' ? 'text-red-800' : 'text-amber-800'}`}>
                {alert.type}
              </p>
              <p className={`text-xs mt-1 ${alert.severity === 'HIGH' ? 'text-red-700' : 'text-amber-700'}`}>
                {alert.message}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {alert.location} • Score: {alert.score?.toFixed(0)}/100
              </p>
            </div>
            <span className="text-lg ml-2">
              {alert.severity === 'HIGH' ? '🚨' : '⚠️'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
