import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, RefreshCw, Compass, AlertTriangle, Radio, PackageCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/authStore';

// Custom Leaflet DivIcons (Original Style with Dynamic Cargo Loaded State)
const emptyTruckIcon = L.divIcon({
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

const loadedTruckIcon = L.divIcon({
  className: 'custom-truck-marker-loaded',
  html: `
    <div style="position: relative; background-color: #10b981; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.5); transform: translate(-50%, -50%); font-size: 22px;">
      🚚
      <span style="position: absolute; top: -6px; right: -6px; background: #f59e0b; color: #000; font-size: 9px; font-weight: 900; padding: 1px 4px; border-radius: 8px; border: 1.5px solid #fff;">📦</span>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22]
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
  driverName?: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  history = [],
  livePoint,
  shipmentStatus = 'DRIVER_ASSIGNED',
  originAddress,
  destinationAddress,
  currentLocationString,
  hasDriverAssigned = true,
  isDriverUser = false,
  driverName
}) => {
  const user = useAuthStore(state => state.user);
  const isShipperOrBroker = user?.company?.type === 'SHIPPER' || user?.company?.type === 'BROKER';
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [pickupPos, setPickupPos] = useState<[number, number] | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<[number, number] | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distanceMiles: string; durationMins: string; targetName: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  // Check if cargo has been picked up
  const isCargoLoaded = ['PICKUP_COMPLETED', 'IN_TRANSIT', 'DELIVERED', 'POD_UPLOADED', 'COMPLETED'].includes(shipmentStatus);
  const activeTruckIcon = isCargoLoaded ? loadedTruckIcon : emptyTruckIcon;

  // 1. Determine Driver's Live Location
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
      const latest = history[history.length - 1];
      if (!isNaN(Number(latest.latitude)) && !isNaN(Number(latest.longitude))) {
        setDriverPos([Number(latest.latitude), Number(latest.longitude)]);
        return;
      }
    }

    // Default driver start position near pickup if device position not active
    if (isDriverUser && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Geolocation permission or position error:", err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [hasDriverAssigned, livePoint, history, isDriverUser]);

  useEffect(() => {
    locateDriverDevice();
  }, [locateDriverDevice]);

  // 2. Geocode Origin & Destination
  useEffect(() => {
    let isMounted = true;

    const geocodeAddress = async (addr: string): Promise<[number, number] | null> => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.error("Geocoding failed for address:", addr, err);
      }
      return null;
    };

    const resolveLocations = async () => {
      let pPos: [number, number] | null = null;
      let dPos: [number, number] | null = null;

      if (originAddress) {
        pPos = await geocodeAddress(originAddress);
      }
      if (destinationAddress) {
        dPos = await geocodeAddress(destinationAddress);
      }

      // Default fallbacks if geocoding yields no result
      if (!pPos) pPos = [34.0522, -118.2437]; // Los Angeles default
      if (!dPos) dPos = [37.7749, -122.4194]; // San Francisco default

      if (isMounted) {
        setPickupPos(pPos);
        setDeliveryPos(dPos);
      }
    };

    resolveLocations();

    return () => { isMounted = false; };
  }, [originAddress, destinationAddress]);

  // 3. Calculate Driving Route & Bounds
  useEffect(() => {
    let isMounted = true;
    if (!pickupPos || !deliveryPos) return;

    const targetPos = ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKUP_STARTED'].includes(shipmentStatus)
      ? pickupPos
      : deliveryPos;

    const startPos = driverPos || pickupPos;

    const newBounds = L.latLngBounds([startPos, targetPos]);
    if (driverPos) newBounds.extend(driverPos);
    if (pickupPos) newBounds.extend(pickupPos);
    if (deliveryPos) newBounds.extend(deliveryPos);
    setBounds(newBounds);

    const fetchOSRMRoute = async () => {
      setLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startPos[1]},${startPos[0]};${targetPos[1]},${targetPos[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          if (isMounted) {
            setRoutePath(coords);
            const distMiles = (route.distance * 0.000621371).toFixed(1);
            const durMins = Math.round(route.duration / 60);

            setRouteInfo({
              distanceMiles: distMiles,
              durationMins: durMins.toString(),
              targetName: targetPos === pickupPos ? 'Pickup Facility' : 'Destination Facility'
            });
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
    <div className="w-full flex flex-col h-full bg-card text-foreground rounded-2xl border shadow-sm overflow-hidden">
      {/* Top Status Banner for Driver Assignment State */}
      {!hasDriverAssigned && (
        <div className="p-3 bg-amber-500/90 text-white backdrop-blur-xs flex items-center justify-between text-xs font-semibold px-4 border-b border-amber-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>
              {isShipperOrBroker
                ? "Awaiting Driver Assignment — Carrier has not assigned a driver to this shipment yet."
                : "Awaiting Driver Assignment — Assign a driver to this shipment to enable live driver GPS tracking."}
            </span>
          </div>
        </div>
      )}

      {hasDriverAssigned && !driverPos && (
        <div className="p-3 bg-blue-600/90 text-white backdrop-blur-xs flex items-center justify-between text-xs font-semibold px-4 border-b border-blue-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-white animate-pulse shrink-0" />
            <span>
              {isDriverUser
                ? "Driver Assigned — Waiting for you to start trip / share live GPS signal..."
                : isShipperOrBroker
                ? "Driver Assigned — Awaiting driver to start trip to enable live GPS tracking."
                : `Driver Assigned (${driverName || 'Fleet Driver'}) — Waiting for driver to start trip to enable live GPS tracking.`}
            </span>
          </div>
        </div>
      )}

      {/* Top Map Header Brief */}
      <div className="p-4 border-b bg-muted/50 flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${driverPos ? (isCargoLoaded ? 'bg-emerald-500 animate-ping' : 'bg-blue-500 animate-ping') : 'bg-amber-500'}`} />
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Real-time Navigation & Route Path
            </h3>
            {isCargoLoaded && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <PackageCheck className="w-3 h-3" /> Freight On Board
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {!hasDriverAssigned
              ? 'Awaiting Driver Assignment'
              : !driverPos
              ? `Driver Assigned ${driverName ? `(${driverName})` : ''} — Awaiting trip start`
              : isCargoLoaded
              ? 'Stage 2: Freight Loaded — En route to Delivery Destination'
              : 'Stage 1: En route to Pickup Warehouse Facility'}
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
          {/* Standard OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {bounds && <MapFitter bounds={bounds} />}

          {/* 1. Driver Location Marker (Dynamic Empty vs Cargo Loaded Icon) */}
          {driverPos && (
            <Marker position={driverPos} icon={activeTruckIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className={`font-bold flex items-center gap-1.5 ${isCargoLoaded ? 'text-emerald-600' : 'text-blue-600'}`}>
                    🚚 Driver GPS Location {isCargoLoaded ? '(Cargo Loaded)' : '(En Route to Pickup)'}
                  </div>
                  <div className="mt-1 text-slate-700 font-medium">
                    {currentLocationString || 'Live Telematics Signal'}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 2. Pickup Warehouse Origin Location Marker */}
          {pickupPos && (
            <Marker position={pickupPos} icon={pickupIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-sky-600 flex items-center gap-1">
                    🏭 Warehouse Origin (Pickup Facility)
                  </div>
                  <div className="mt-1 text-slate-700">{originAddress || 'Origin Warehouse'}</div>
                  {isCargoLoaded && (
                    <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      ✓ Cargo Picked Up & Dispatched
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 3. Delivery Facility Destination Location Marker */}
          {deliveryPos && (
            <Marker position={deliveryPos} icon={deliveryIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-rose-600 flex items-center gap-1">
                    🎯 Destination Receiving Facility
                  </div>
                  <div className="mt-1 text-slate-700">{destinationAddress || 'Destination Facility'}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 4. Active Real-time Driving Route Line */}
          {routePath.length > 0 && (
            <Polyline
              positions={routePath}
              color={isCargoLoaded ? "#10b981" : "#2563eb"}
              weight={5}
              opacity={0.85}
              dashArray={isCargoLoaded ? undefined : "8, 12"}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};
