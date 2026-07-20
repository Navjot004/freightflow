import { useState, useEffect, useRef } from 'react';
import api from '../core/api';
import { useToast } from '../components/ui/Toast';

interface TrackingData {
  latitude: string;
  longitude: string;
  speed?: string;
  heading?: string;
  accuracy?: string;
  altitude?: string;
}

export function useLocationTracking(shipmentId: string, isActive: boolean) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  // Track last sent time/coords to prevent spamming
  const lastUpdateRef = useRef<{ time: number, lat: number, lng: number } | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      toast("Geolocation is not supported by your browser", "error");
      return;
    }

    setIsTracking(true);
    setError(null);
    toast("Live GPS tracking is now active", "success");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading, accuracy, altitude } = position.coords;
        
        const now = Date.now();
        const last = lastUpdateRef.current;
        
        if (last && (now - last.time < 10000)) {
            return; 
        }
        
        lastUpdateRef.current = { time: now, lat: latitude, lng: longitude };

        const payload: TrackingData = {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          speed: speed !== null ? speed.toString() : undefined,
          heading: heading !== null ? heading.toString() : undefined,
          accuracy: accuracy !== null ? accuracy.toString() : undefined,
          altitude: altitude !== null ? altitude.toString() : undefined,
        };

        api.post(`/shipments/${shipmentId}/tracking`, payload)
          .catch(err => {
            console.error("Failed to post tracking data", err);
          });
      },
      (err) => {
        setIsTracking(false);
        setError(err.message);
        toast(err.message, "error");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast("Live GPS tracking has been stopped", "info");
  };

  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking();
    } else if (!isActive && isTracking) {
      stopTracking();
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isActive, shipmentId]);

  return { isTracking, error, startTracking, stopTracking };
}
