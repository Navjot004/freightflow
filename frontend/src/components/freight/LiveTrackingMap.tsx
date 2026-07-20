import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapFitter = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    // Force map to recalculate its dimensions after layout to fix grey tiles
    setTimeout(() => {
      map.invalidateSize();
      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, 250);
  }, [positions, map]);
  return null;
};

interface TrackingPoint {
  id: string;
  latitude: string;
  longitude: string;
  speed?: string;
  heading?: string;
  accuracy?: string;
  timestamp: string;
}

interface LiveTrackingMapProps {
  history: TrackingPoint[];
  livePoint?: TrackingPoint | null;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ history, livePoint }) => {
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [latest, setLatest] = useState<TrackingPoint | null>(null);

  useEffect(() => {
    const coords: [number, number][] = history.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
    if (livePoint) {
      coords.push([parseFloat(livePoint.latitude), parseFloat(livePoint.longitude)]);
      setLatest(livePoint);
    } else if (history.length > 0) {
      setLatest(history[history.length - 1]);
    }
    setPositions(coords);
  }, [history, livePoint]);

  const formatSpeed = (s?: string) => {
    if (!s) return "N/A";
    const mph = parseFloat(s) * 2.23694; // m/s to mph
    return `${mph.toFixed(1)} mph`;
  };

  const center: [number, number] = positions.length > 0 ? positions[positions.length - 1] : [39.8283, -98.5795]; // Center of US as fallback

  return (
    <div className="w-full flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Live GPS Tracking</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {latest 
              ? `Last updated: ${new Date(latest.timestamp).toLocaleTimeString()}` 
              : 'No tracking history available. Start trip to begin tracking.'}
          </p>
        </div>
        
        {latest && (
          <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-300">
            <div><span className="font-semibold">Speed:</span> {formatSpeed(latest.speed)}</div>
            <div><span className="font-semibold">Heading:</span> {latest.heading ? `${parseFloat(latest.heading).toFixed(0)}°` : 'N/A'}</div>
            <div><span className="font-semibold">Accuracy:</span> {latest.accuracy ? `±${parseFloat(latest.accuracy).toFixed(0)}m` : 'N/A'}</div>
          </div>
        )}
      </div>
      
      <div className="flex-1 relative" style={{ height: '500px' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFitter positions={positions} />
          
          {positions.length > 0 && (
            <Polyline positions={positions} color="blue" weight={5} opacity={0.6} />
          )}

          {latest && (
            <Marker position={[parseFloat(latest.latitude), parseFloat(latest.longitude)]}>
              <Popup>
                <div>
                  <p className="font-bold mb-1">Current Truck Location</p>
                  <p>Speed: {formatSpeed(latest.speed)}</p>
                  <p>Updated: {new Date(latest.timestamp).toLocaleTimeString()}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {positions.length > 0 && <MapFitter positions={positions} />}
        </MapContainer>
      </div>
    </div>
  );
};
