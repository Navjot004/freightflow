import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, RefreshCw, Compass, AlertTriangle, Radio, PackageCheck, CheckCircle2 } from 'lucide-react';
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
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

interface LiveTrackingMapProps {
  history?: Array<{ latitude: number; longitude: number; timestamp?: string }>;
  livePoint?: { latitude: number; longitude: number; timestamp?: string };
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

  const isDelivered = ['DELIVERED', 'POD_SUBMITTED', 'POD_UPLOADED', 'COMPLETED', 'CLOSED'].includes((shipmentStatus || '').toUpperCase());
  const isCargoLoaded = ['PICKUP_COMPLETED', 'IN_TRANSIT', 'DELIVERED', 'POD_SUBMITTED', 'POD_UPLOADED', 'COMPLETED', 'CLOSED'].includes((shipmentStatus || '').toUpperCase());
  const activeTruckIcon = isCargoLoaded ? loadedTruckIcon : emptyTruckIcon;

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

    if (pickupPos) {
      setDriverPos([pickupPos[0] + 0.005, pickupPos[1] + 0.005]);
    }
  }, [hasDriverAssigned, livePoint, history, pickupPos]);

  useEffect(() => {
    if (!originAddress) return;
    const fetchOrigin = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originAddress)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setPickupPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Geocoding origin error:", err);
      }
    };
    fetchOrigin();
  }, [originAddress]);

  useEffect(() => {
    if (!destinationAddress) return;
    const fetchDestination = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationAddress)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setDeliveryPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Geocoding destination error:", err);
      }
    };
    fetchDestination();
  }, [destinationAddress]);

  useEffect(() => {
    locateDriverDevice();
  }, [locateDriverDevice]);

  useEffect(() => {
    const validCoords: [number, number][] = [];
    if (driverPos && !isDelivered) validCoords.push(driverPos);
    if (pickupPos) validCoords.push(pickupPos);
    if (deliveryPos) validCoords.push(deliveryPos);

    if (validCoords.length > 0) {
      const newBounds = L.latLngBounds(validCoords);
      setBounds(newBounds);
    }
  }, [driverPos, pickupPos, deliveryPos, isDelivered]);

  useEffect(() => {
    let isMounted = true;
    const fetchOSRMRoute = async () => {
      const startCoord = isDelivered ? pickupPos : (driverPos || pickupPos);
      const targetCoord = deliveryPos;

      if (!startCoord || !targetCoord) return;

      try {
        setLoadingRoute(true);
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoord[1]},${startCoord[0]};${targetCoord[1]},${targetCoord[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (isMounted && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setRoutePath(coordinates);

          const distanceMi = (route.distance / 1609.34).toFixed(1);
          const durationM = Math.round(route.duration / 60).toString();
          setRouteInfo({
            distanceMiles: distanceMi,
            durationMins: durationM,
            targetName: 'Destination Facility'
          });
        }
      } catch (err) {
        console.error("OSRM Route calculation error:", err);
      } finally {
        if (isMounted) setLoadingRoute(false);
      }
    };

    fetchOSRMRoute();
    return () => { isMounted = false; };
  }, [driverPos, pickupPos, deliveryPos, shipmentStatus, originAddress, destinationAddress, isDelivered]);

  const defaultCenter: [number, number] = (isDelivered ? (deliveryPos || pickupPos) : (driverPos || pickupPos || deliveryPos)) || [39.8283, -98.5795];

  return (
    <div className="w-full flex flex-col h-full bg-card text-foreground rounded-2xl border shadow-sm overflow-hidden">
      {isDelivered ? (
        <div className="p-3 bg-emerald-600 text-white backdrop-blur-xs flex items-center justify-between text-xs font-semibold px-4 border-b border-emerald-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>
              Shipment Delivered — Freight has arrived at destination and delivery/POD is completed.
            </span>
          </div>
        </div>
      ) : !hasDriverAssigned ? (
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
      ) : !driverPos ? (
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
      ) : null}

      <div className="p-4 border-b bg-muted/50 flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isDelivered ? 'bg-emerald-500' : driverPos ? (isCargoLoaded ? 'bg-emerald-500 animate-ping' : 'bg-blue-500 animate-ping') : 'bg-amber-500'}`} />
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Real-time Navigation & Route Path
            </h3>
            {isDelivered ? (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Delivered & Completed
              </span>
            ) : isCargoLoaded ? (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <PackageCheck className="w-3 h-3" /> Freight On Board
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isDelivered
              ? 'Shipment Delivered & Completed — Driver finished trip'
              : !hasDriverAssigned
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

      <div className="flex-1 relative" style={{ height: '480px' }}>
        <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {bounds && <MapFitter bounds={bounds} />}

          {driverPos && !isDelivered && (
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

          {pickupPos && (
            <Marker position={pickupPos} icon={pickupIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-sky-600 flex items-center gap-1">
                    🏭 Warehouse Origin (Pickup Facility)
                  </div>
                  <div className="mt-1 text-slate-700">{originAddress || 'Origin Warehouse'}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {deliveryPos && (
            <Marker position={deliveryPos} icon={deliveryIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-rose-600 flex items-center gap-1">
                    🎯 Destination Receiving Facility
                  </div>
                  <div className="mt-1 text-slate-700">{destinationAddress || 'Destination Facility'}</div>
                  {isDelivered && (
                    <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      ✓ Shipment Delivered & POD Verified
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

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
