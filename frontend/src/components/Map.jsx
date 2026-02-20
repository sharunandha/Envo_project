import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getColorByRiskLevel } from '../utils/helpers';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const MapComponent = ({ dams, risks, selectedDam, onDamSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 4);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map.current);
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => map.current.removeLayer(marker));
    markersRef.current = {};

    // Add dam markers
      if (dams && Array.isArray(dams)) {
      dams.forEach(dam => {
        const riskData = risks?.find(r => r.dam?.id === dam.id);
        const riskLevel = riskData?.floodRisk || 'LOW';
        const riskScore = (riskData && typeof riskData.floodScore === 'number') ? riskData.floodScore : 0;
        const lsLevel = riskData?.landslideRisk || 'LOW';
        const lsScore = (riskData && typeof riskData.landslideScore === 'number') ? riskData.landslideScore : 0;

        const scoreStr = (typeof riskScore === 'number') ? riskScore.toFixed(0) : 'N/A';
        const capStr = (typeof dam.capacity === 'number') ? dam.capacity.toFixed(2) : 'N/A';
        const envSummary = riskData?.environmentalSummary || {};

        const color = getColorByRiskLevel(riskLevel);

        // Create custom icon
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              ◆
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([dam.latitude, dam.longitude], { icon })
          .bindPopup(`
            <div class="bg-slate-800 text-white p-3 rounded" style="min-width: 220px;">
              <h3 class="font-bold text-lg">${dam.name}</h3>
              <p class="text-sm text-gray-300">${dam.state} | ${dam.river}</p>
              <hr class="my-2 border-gray-600" />
              <p class="text-xs">
                <span class="font-semibold">Flood Risk:</span>
                <span style="color: ${color}" class="font-bold ml-1">${riskLevel} (${scoreStr}/100)</span>
              </p>
              <p class="text-xs mt-1">
                <span class="font-semibold">Landslide Risk:</span>
                <span style="color: ${getColorByRiskLevel(lsLevel)}" class="font-bold ml-1">${lsLevel} (${lsScore}/100)</span>
              </p>
              <hr class="my-2 border-gray-600" />
              <p class="text-xs mt-1">
                <span class="font-semibold">Rainfall (7d):</span>
                <span class="ml-1">${envSummary.cumRainfall7d ?? 'N/A'} mm</span>
              </p>
              <p class="text-xs mt-1">
                <span class="font-semibold">River Discharge:</span>
                <span class="ml-1">${envSummary.riverDischarge ?? 'N/A'} m³/s</span>
              </p>
              <p class="text-xs mt-1">
                <span class="font-semibold">Soil Moisture:</span>
                <span class="ml-1">${envSummary.soilMoisture ?? 'N/A'}%</span>
              </p>
              <p class="text-xs mt-1">
                <span class="font-semibold">Capacity:</span>
                <span class="ml-1">${capStr} BCM</span>
              </p>
              <p class="text-xs text-green-400 mt-2">📡 Live data</p>
            </div>
          `)
          .addTo(map.current);

        marker.on('click', () => onDamSelect(dam.id));
        markersRef.current[dam.id] = marker;
      });
    }

    return () => {
      // Cleanup on unmount
    };
  }, [dams, risks, onDamSelect]);

  // Invalidate map size when container resizes
  useEffect(() => {
    if (!map.current) return;
    const timer = setTimeout(() => map.current.invalidateSize(), 200);
    return () => clearTimeout(timer);
  });

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg shadow-lg"
      style={{ minHeight: '300px', height: '100%' }}
    />
  );
};

export default MapComponent;
