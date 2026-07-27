import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, RefreshCw, Compass, AlertTriangle, Radio } from 'lucide-react';
import { Button } from '../ui/button';

// Custom Leaflet DivIcons to avoid image asset issues
const truckIcon = L.divIcon({
  className: 'custom-truck-marker',
  html: `
    <div style="background-color: #2563eb; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 10px rgba(37,99,235,0.4); transform: translate(-50%, -50%); font-size: 20px;">
      🚚
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const pickupIcon = L.divIcon({
  className: 'custom-pickup-marker',
  html: `
    <div style="background-color: #10b981; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 10px rgba(16,185,129,0.4); transform: translate(-50%, -50%); font-size: 18px;">
      📦
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const deliveryIcon = L.divIcon({
  className: 'custom-delivery-marker',
  html: `
    <div style="background-color: #ef4444; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 10px rgba(239,68,68,0.4); transform: translate(-50%, -50%); font-size: 18px;">
      🏁
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const MapFitter = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bounds, map]);
  return null;
};

interface TrackingPoint {
  id?: string;
  latitude: string | number;
  longitude: string | number;
  speed?: string | number;
  heading?: string | number;
  accuracy?: string | number;
  timestamp?: string;
}

interface LiveTrackingMapProps {
  history?: TrackingPoint[];
  livePoint?: TrackingPoint | null;
  shipmentStatus?: string;
  originAddress?: string;
  destinationAddress?: string;
  currentLocationString?: string;
  hasDriverAssigned?: boolean;
  isDriverUser?: boolean;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  history = [],
  livePoint,
  shipmentStatus = 'DRIVER_ASSIGNED',
  originAddress,
  destinationAddress,
  currentLocationString,
  hasDriverAssigned = true,
  isDriverUser = false
}) => {
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [pickupPos, setPickupPos] = useState<[number, number] | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<[number, number] | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distanceMiles: string; durationMins: string; targetName: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  // 1. Determine Driver's Live Device Location (Strictly for Assigned Driver)
  const locateDriverDevice = useCallback(() => {
    if (!hasDriverAssigned) {
      setDriverPos(null);
      return;
    }

    if (livePoint && !isNaN(Number(livePoint.latitude)) && !isNaN(Number(livePoint.longitude))) {
      setDriverPos([Number(livePoint.latitude), Number(livePoint.longitude)]);
      return;
    }

    if (history.length > 0) {
      const last = history[history.length - 1];
      if (!isNaN(Number(last.latitude)) && !isNaN(Number(last.longitude))) {
        setDriverPos([Number(last.latitude), Number(last.longitude)]);
        return;
      }
    }

    // Fallback to browser HTML5 Geolocation ONLY if logged-in user IS the assigned driver
    if (isDriverUser && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Geolocation warning:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }

    setDriverPos(null);
  }, [hasDriverAssigned, livePoint, history, isDriverUser]);

  useEffect(() => {
    locateDriverDevice();
  }, [locateDriverDevice]);

  // 2. Geocode Addresses (Origin & Destination)
  useEffect(() => {
    let isMounted = true;

    const geocodeAddress = async (addr: string): Promise<[number, number] | null> => {
      if (!addr) return null;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (e) {
        console.error("Geocoding error for:", addr, e);
      }
      return null;
    };

    const runGeocoding = async () => {
      if (originAddress) {
        const pPos = await geocodeAddress(originAddress);
        if (isMounted && pPos) setPickupPos(pPos);
      }
      if (destinationAddress) {
        const dPos = await geocodeAddress(destinationAddress);
        if (isMounted && dPos) setDeliveryPos(dPos);
      }
    };

    runGeocoding();
    return () => { isMounted = false; };
  }, [originAddress, destinationAddress]);

  // 3. Calculate OSRM Driving Route
  useEffect(() => {
    let isMounted = true;
    const isPickupLeg = ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKUP_STARTED'].includes(shipmentStatus);
    
    // Target destination for current leg
    const startCoord = driverPos || pickupPos;
    const targetCoord = driverPos ? (isPickupLeg ? pickupPos : (deliveryPos || pickupPos)) : deliveryPos;

    if (!startCoord || !targetCoord) {
      if (pickupPos && deliveryPos && isMounted) {
        setBounds(L.latLngBounds([pickupPos, deliveryPos]));
      }
      return;
    }

    const fetchOSRMRoute = async () => {
      setLoadingRoute(true);
      try {
        // OSRM expects: longitude,latitude
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${targetCoord[1]},${targetCoord[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
          const distMi = (route.distance / 1609.34).toFixed(1);
          const durMins = Math.round(route.duration / 60).toString();

          if (isMounted) {
            setRoutePath(coords);
            setRouteInfo({
              distanceMiles: distMi,
              durationMins: durMins,
              targetName: driverPos
                ? (isPickupLeg ? `Pickup (${originAddress || 'Origin'})` : `Delivery (${destinationAddress || 'Destination'})`)
                : `Total Route Path`
            });

            const allPoints: [number, number][] = [startCoord, targetCoord, ...coords];
            if (pickupPos) allPoints.push(pickupPos);
            if (deliveryPos) allPoints.push(deliveryPos);
            setBounds(L.latLngBounds(allPoints));
          }
        }
      } catch (err) {
        console.error("OSRM Route calculation error:", err);
      } finally {
        if (isMounted) setLoadingRoute(false);
      }
    };

    fetchOSRMRoute();
    return () => { isMounted = false; };
  }, [driverPos, pickupPos, deliveryPos, shipmentStatus, originAddress, destinationAddress]);

  // Default fallback center
  const defaultCenter: [number, number] = driverPos || pickupPos || deliveryPos || [39.8283, -98.5795];

  const isPickupLeg = ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKUP_STARTED'].includes(shipmentStatus);

  return (
    <div className="w-full flex flex-col h-full bg-card rounded-2xl border shadow-sm overflow-hidden">
      {/* Top Status Banner for Driver Assignment State */}
      {!hasDriverAssigned && (
        <div className="p-3 bg-amber-500/90 text-white backdrop-blur-xs flex items-center justify-between text-xs font-semibold px-4 border-b border-amber-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>Awaiting Driver Assignment — Assign a driver to this shipment to enable live driver GPS tracking.</span>
          </div>
        </div>
      )}

      {hasDriverAssigned && !driverPos && (
        <div className="p-3 bg-blue-600/90 text-white backdrop-blur-xs flex items-center justify-between text-xs font-semibold px-4 border-b border-blue-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-white animate-pulse shrink-0" />
            <span>Driver Assigned — Waiting for Driver live GPS signal...</span>
          </div>
        </div>
      )}

      {/* Top Map Header Brief */}
      <div className="p-4 border-b bg-muted/50 flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${driverPos ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Real-time Navigation & Route Path
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {!hasDriverAssigned ? 'Awaiting Driver Assignment' : isPickupLeg ? 'Stage 1: En route to Pickup Facility' : 'Stage 2: En route to Delivery Destination'}
          </p>
        </div>

        {routeInfo && (
          <div className="flex items-center gap-3 text-xs bg-background px-3 py-2 rounded-xl border font-medium">
            <div className="flex items-center gap-1.5 text-primary">
              <Navigation className="w-3.5 h-3.5" />
              <span>{routeInfo.distanceMiles} mi</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>~{routeInfo.durationMins} mins</span>
            </div>
          </div>
        )}

        <Button size="sm" variant="outline" onClick={locateDriverDevice} className="rounded-xl text-xs gap-1.5 h-9">
          <RefreshCw className={`w-3.5 h-3.5 ${loadingRoute ? 'animate-spin' : ''}`} />
          Recalibrate GPS
        </Button>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative" style={{ height: '480px' }}>
        <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {bounds && <MapFitter bounds={bounds} />}

          {/* 1. Driver Location Marker */}
          {driverPos && (
            <Marker position={driverPos} icon={truckIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-blue-600 flex items-center gap-1">
                    🚚 Driver Current Location
                  </div>
                  <div className="mt-1 text-slate-600">
                    {currentLocationString || 'Live GPS Position'}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 2. Pickup Location Marker */}
          {pickupPos && (
            <Marker position={pickupPos} icon={pickupIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-emerald-600">📦 Pickup Facility (Origin)</div>
                  <div className="mt-1 text-slate-600">{originAddress || 'Origin'}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 3. Delivery Location Marker */}
          {deliveryPos && (
            <Marker position={deliveryPos} icon={deliveryIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-rose-600">🏁 Delivery Facility (Destination)</div>
                  <div className="mt-1 text-slate-600">{destinationAddress || 'Destination'}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 4. Active Real-time Driving Route Line */}
          {routePath.length > 0 && (
            <Polyline
              positions={routePath}
              color={isPickupLeg ? "#10b981" : "#2563eb"}
              weight={6}
              opacity={0.8}
              dashArray={isPickupLeg ? "8, 8" : undefined}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};
