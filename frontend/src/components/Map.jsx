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

// Warning zone config by risk level
const ZONE_CONFIG = {
  HIGH:   { color: '#ef4444', fillOpacity: 0.18, radius: 45000, weight: 2.5 },
  MEDIUM: { color: '#f59e0b', fillOpacity: 0.12, radius: 30000, weight: 2 },
  LOW:    { color: '#10b981', fillOpacity: 0.06, radius: 18000, weight: 1 },
};

export const MapComponent = ({ dams, risks, selectedDam, onDamSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const layersRef = useRef([]);        // all dynamic layers (markers + zones)
  const controlRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map once
    if (!map.current) {
      map.current = L.map(mapContainer.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);

      // Satellite layer (default)
      const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics', maxZoom: 19 }
      );

      // Satellite with labels
      const satelliteLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, pane: 'overlayPane' }
      );

      // Street map layer
      const street = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
      );

      // Terrain layer
      const terrain = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
      );

      // Group satellite + labels
      const satelliteGroup = L.layerGroup([satellite, satelliteLabels]);

      // Add satellite as default
      satelliteGroup.addTo(map.current);

      // Layer control
      controlRef.current = L.control.layers(
        { '🛰️ Satellite': satelliteGroup, '🗺️ Street Map': street, '🏔️ Terrain': terrain },
        {},
        { position: 'topright' }
      ).addTo(map.current);
    }

    // Clear all existing dynamic layers
    layersRef.current.forEach(layer => {
      if (map.current.hasLayer(layer)) map.current.removeLayer(layer);
    });
    layersRef.current = [];

    // Add dam markers + warning zones
    if (dams && Array.isArray(dams)) {
      dams.forEach(dam => {
        const riskData = risks?.find(r => r.dam?.id === dam.id);
        const floodLevel = riskData?.floodRisk || 'LOW';
        const lsLevel = riskData?.landslideRisk || 'LOW';
        const floodScore = (riskData && typeof riskData.floodScore === 'number') ? riskData.floodScore : 0;
        const lsScore = (riskData && typeof riskData.landslideScore === 'number') ? riskData.landslideScore : 0;
        const overallRisk = riskData?.overallRisk || Math.max(floodScore, lsScore);

        // Determine dominant risk level for the zone
        const dominantLevel = overallRisk >= 70 ? 'HIGH' : overallRisk >= 40 ? 'MEDIUM' : 'LOW';
        const zoneConf = ZONE_CONFIG[dominantLevel];

        const scoreStr = (typeof floodScore === 'number') ? floodScore.toFixed(0) : 'N/A';
        const capStr = (typeof dam.capacity === 'number') ? dam.capacity.toFixed(2) : 'N/A';
        const envSummary = riskData?.environmentalSummary || {};

        const markerColor = getColorByRiskLevel(floodLevel);

        // ---------- Warning Zone Circle ----------
        const zone = L.circle([dam.latitude, dam.longitude], {
          color: zoneConf.color,
          fillColor: zoneConf.color,
          fillOpacity: zoneConf.fillOpacity,
          radius: zoneConf.radius,
          weight: zoneConf.weight,
          dashArray: dominantLevel === 'HIGH' ? '' : '6,4',
          interactive: false,
        }).addTo(map.current);
        layersRef.current.push(zone);

        // ---------- Dam Marker ----------
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${markerColor};
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: white;
              font-size: 14px;
              border: 3px solid white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.4);
            ">
              ${dominantLevel === 'HIGH' ? '⚠' : dominantLevel === 'MEDIUM' ? '◆' : '●'}
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const popupContent = `
          <div style="min-width:240px; font-family:system-ui,sans-serif; padding:4px 0;">
            <h3 style="font-weight:700; font-size:15px; margin:0 0 4px;">${dam.name}</h3>
            <p style="font-size:12px; color:#94a3b8; margin:0 0 8px;">${dam.state} | ${dam.river}</p>
            <hr style="border-color:#475569; margin:6px 0;" />
            <p style="font-size:12px; margin:4px 0;">
              <span style="font-weight:600;">Flood Risk:</span>
              <span style="color:${markerColor}; font-weight:700; margin-left:4px;">${floodLevel} (${scoreStr}/100)</span>
            </p>
            <p style="font-size:12px; margin:4px 0;">
              <span style="font-weight:600;">Landslide Risk:</span>
              <span style="color:${getColorByRiskLevel(lsLevel)}; font-weight:700; margin-left:4px;">${lsLevel} (${lsScore}/100)</span>
            </p>
            <hr style="border-color:#475569; margin:6px 0;" />
            <p style="font-size:11px; margin:3px 0;">
              <span style="font-weight:600;">Rainfall (7d):</span>
              <span style="margin-left:4px;">${envSummary.cumRainfall7d ?? 'N/A'} mm</span>
            </p>
            <p style="font-size:11px; margin:3px 0;">
              <span style="font-weight:600;">River Discharge:</span>
              <span style="margin-left:4px;">${envSummary.riverDischarge ?? 'N/A'} m³/s</span>
            </p>
            <p style="font-size:11px; margin:3px 0;">
              <span style="font-weight:600;">Soil Moisture:</span>
              <span style="margin-left:4px;">${envSummary.soilMoisture ?? 'N/A'}%</span>
            </p>
            <p style="font-size:11px; margin:3px 0;">
              <span style="font-weight:600;">Capacity:</span>
              <span style="margin-left:4px;">${capStr} TMC</span>
            </p>
            <p style="font-size:10px; color:#4ade80; margin:8px 0 0;">📡 Live data from Open-Meteo, NASA, USGS, GloFAS</p>
          </div>
        `;

        const marker = L.marker([dam.latitude, dam.longitude], { icon })
          .bindPopup(popupContent, {
            className: 'dark-popup',
            maxWidth: 280,
          })
          .addTo(map.current);

        marker.on('click', () => onDamSelect(dam.id));
        layersRef.current.push(marker);
      });

      // ---------- Map Legend ----------
      const existingLegend = document.querySelector('.map-legend');
      if (existingLegend) existingLegend.remove();

      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
          <div style="
            background: rgba(255,255,255,0.95);
            padding: 10px 14px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            font-family: system-ui, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #1f2937;
          ">
            <div style="font-weight:700; margin-bottom:6px; font-size:13px;">Warning Zones</div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:14px; height:14px; border-radius:50%; background:#ef4444; display:inline-block; border:2px solid #fff; box-shadow:0 0 0 1px #ef4444;"></span>
              <span>High Risk Zone</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:14px; height:14px; border-radius:50%; background:#f59e0b; display:inline-block; border:2px solid #fff; box-shadow:0 0 0 1px #f59e0b;"></span>
              <span>Medium Risk Zone</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:14px; height:14px; border-radius:50%; background:#10b981; display:inline-block; border:2px solid #fff; box-shadow:0 0 0 1px #10b981;"></span>
              <span>Low Risk Zone</span>
            </div>
          </div>
        `;
        return div;
      };
      legend.addTo(map.current);
    }

    return () => {};
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
