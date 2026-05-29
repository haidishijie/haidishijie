import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Car, Drive, Charge } from '../types/teslamate';
import {
  fetchCarsData,
  fetchDrivesData,
  fetchChargesData,
  fetchWeeklyStats,
  fetchSummary,
  fetchMonthlyStats,
  fetchMileageTrend,
  fetchEfficiencyStats,
  fetchLocations,
} from '../utils/api';
import type {
  WeeklyResponse,
  SummaryResponse,
  MonthlyResponse,
  MileageResponse,
  EfficiencyResponse,
  LocationsResponse,
} from '../utils/api';

const REFRESH_INTERVAL_MS = 30_000;

interface DashboardData {
  car: Car | null;
  drives: Drive[];
  charges: Charge[];
  weekly: WeeklyResponse | null;
  summary: SummaryResponse | null;
  monthly: MonthlyResponse | null;
  mileage: MileageResponse | null;
  efficiency: EfficiencyResponse | null;
  locations: LocationsResponse | null;
}

interface UseTeslaMateDataReturn extends DashboardData {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  countdown: number;
}

/**
 * Custom hook to fetch and periodically refresh all dashboard data.
 * Fetches car state, drives, charges, and aggregated stats.
 */
export function useTeslaMateData(): UseTeslaMateDataReturn {
  const [data, setData] = useState<DashboardData>({
    car: null,
    drives: [],
    charges: [],
    weekly: null,
    summary: null,
    monthly: null,
    mileage: null,
    efficiency: null,
    locations: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearCountdown();
    setCountdown(REFRESH_INTERVAL_MS / 1000);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);
  }, [clearCountdown]);

  const refresh = useCallback(async () => {
    try {
      setError(null);

      // Fetch core data in parallel
      const [carsResult, drivesResult, chargesResult, weekly, summary, monthly, mileage, efficiency, locations] =
        await Promise.allSettled([
          fetchCarsData(),
          fetchDrivesData(1, 20),
          fetchChargesData(1, 20),
          fetchWeeklyStats(),
          fetchSummary(),
          fetchMonthlyStats(),
          fetchMileageTrend('day', 30),
          fetchEfficiencyStats(20),
          fetchLocations(),
        ]);

      const car = carsResult.status === 'fulfilled' && carsResult.value.cars.length > 0
        ? carsResult.value.cars[0]
        : null;
      const drives = drivesResult.status === 'fulfilled' ? drivesResult.value.drives : [];
      const charges = chargesResult.status === 'fulfilled' ? chargesResult.value.charges : [];

      setData({
        car,
        drives,
        charges,
        weekly: weekly.status === 'fulfilled' ? weekly.value : null,
        summary: summary.status === 'fulfilled' ? summary.value : null,
        monthly: monthly.status === 'fulfilled' ? monthly.value : null,
        mileage: mileage.status === 'fulfilled' ? mileage.value : null,
        efficiency: efficiency.status === 'fulfilled' ? efficiency.value : null,
        locations: locations.status === 'fulfilled' ? locations.value : null,
      });

      setLastUpdated(new Date());
      setLoading(false);
      startCountdown();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setLoading(false);
    }
  }, [startCountdown]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      clearCountdown();
    };
  }, [refresh, clearCountdown]);

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    refresh,
    countdown,
  };
}
