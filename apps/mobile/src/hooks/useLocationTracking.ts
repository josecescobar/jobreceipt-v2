import { useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { LOCATION_DISTANCE_INTERVAL, LOCATION_TIME_INTERVAL } from '../lib/constants';

interface Coord {
  latitude: number;
  longitude: number;
}

interface TripState {
  isTracking: boolean;
  distanceMeters: number;
  distanceMiles: number;
  deductionCents: number;
  startTime: number | null;
  coords: Coord[];
}

function haversineDistance(a: Coord, b: Coord): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const METERS_PER_MILE = 1609.344;

export function useLocationTracking() {
  const [trip, setTrip] = useState<TripState>({
    isTracking: false,
    distanceMeters: 0,
    distanceMiles: 0,
    deductionCents: 0,
    startTime: null,
    coords: [],
  });

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastCoordRef = useRef<Coord | null>(null);

  const startTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    lastCoordRef.current = null;
    setTrip({
      isTracking: true,
      distanceMeters: 0,
      distanceMiles: 0,
      deductionCents: 0,
      startTime: Date.now(),
      coords: [],
    });

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: LOCATION_DISTANCE_INTERVAL,
        timeInterval: LOCATION_TIME_INTERVAL,
      },
      (location) => {
        const newCoord: Coord = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setTrip((prev) => {
          let addedDistance = 0;
          if (lastCoordRef.current) {
            addedDistance = haversineDistance(lastCoordRef.current, newCoord);
          }
          lastCoordRef.current = newCoord;

          const totalMeters = prev.distanceMeters + addedDistance;
          const totalMiles = totalMeters / METERS_PER_MILE;
          const deductionCents = Math.round(totalMiles * IRS_MILEAGE_RATE_CENTS);

          return {
            ...prev,
            distanceMeters: totalMeters,
            distanceMiles: totalMiles,
            deductionCents,
            coords: [...prev.coords, newCoord],
          };
        });
      },
    );
  }, []);

  const stopTracking = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setTrip((prev) => ({ ...prev, isTracking: false }));
  }, []);

  return {
    ...trip,
    startTracking,
    stopTracking,
  };
}
