import type { Car, Drive, Charge, Position } from '../types/teslamate';
export type { Car, Drive, Charge, Position };

const API_BASE = '/api';

/** Generic fetch helper with error handling */
async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// ─── Car ──────────────────────────────────────────────────────────

export interface CarResponse {
  cars: Car[];
}

export async function fetchCarsData(): Promise<CarResponse> {
  return fetchJSON<CarResponse>(`${API_BASE}/car`);
}

// ─── Drives ───────────────────────────────────────────────────────

export interface DrivesResponse {
  drives: Drive[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchDrivesData(
  carId: number,
  limit = 20,
  offset = 0,
): Promise<DrivesResponse> {
  return fetchJSON<DrivesResponse>(`${API_BASE}/drives?limit=${limit}&offset=${offset}`);
}

export interface DriveDetailResponse {
  drive: Drive;
}

export async function fetchDriveDetail(driveId: number): Promise<DriveDetailResponse> {
  return fetchJSON<DriveDetailResponse>(`${API_BASE}/drives/${driveId}`);
}

export interface DrivePositionsResponse {
  positions: Position[];
}

export async function fetchDrivePositions(driveId: number): Promise<DrivePositionsResponse> {
  return fetchJSON<DrivePositionsResponse>(`${API_BASE}/drives/${driveId}/positions`);
}

// ─── Charges ─────────────────────────────────────────────────────

export interface ChargesResponse {
  charges: Charge[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchChargesData(
  carId: number,
  limit = 20,
  offset = 0,
): Promise<ChargesResponse> {
  return fetchJSON<ChargesResponse>(`${API_BASE}/charges?limit=${limit}&offset=${offset}`);
}

// ─── Stats ────────────────────────────────────────────────────────

export interface WeeklyResponse {
  weekStart: string | null;
  totalDistance: number;
  totalDuration: number;
  driveCount: number;
  daily: { day: string; distance: number }[];
}

export async function fetchWeeklyStats(): Promise<WeeklyResponse> {
  return fetchJSON<WeeklyResponse>(`${API_BASE}/stats/weekly`);
}

export interface MonthlyResponse {
  driveStats: {
    month: string;
    distance: number;
    duration_min: number;
    drive_count: string;
    avg_speed: number;
  }[];
  chargeStats: {
    month: string;
    energy_added: number;
    energy_used: number;
    charge_count: string;
    cost: number;
  }[];
}

export async function fetchMonthlyStats(): Promise<MonthlyResponse> {
  return fetchJSON<MonthlyResponse>(`${API_BASE}/stats/monthly`);
}

export interface SummaryResponse {
  drives: {
    total_distance: number;
    total_duration: number;
    drive_count: string;
    avg_efficiency: number;
    max_speed: number;
    first_drive: string;
  } | null;
  charges: {
    total_energy: number;
    total_cost: number;
    charge_count: string;
    avg_energy_per_charge: number;
    fast_charge_count: string;
  } | null;
  car: { name: string; display_name: string; odometer: number | null } | null;
}

export async function fetchSummary(): Promise<SummaryResponse> {
  return fetchJSON<SummaryResponse>(`${API_BASE}/stats/summary`);
}

export interface MileageResponse {
  mileage: { period: string; distance: number; duration_min: number; drive_count: string }[];
  groupBy: string;
}

export async function fetchMileageTrend(groupBy = 'day', limit = 30): Promise<MileageResponse> {
  return fetchJSON<MileageResponse>(`${API_BASE}/stats/mileage?groupBy=${groupBy}&limit=${limit}`);
}

export interface EfficiencyResponse {
  efficiency: {
    drive_id: number;
    date: string;
    distance: number;
    range_consumed: number;
    wh_per_km: number | null;
    efficiency_pct: number | null;
    outside_temp_avg: number;
    speed_max: number;
    duration_min: number;
  }[];
  avgWhPerKm: number | null;
}

export async function fetchEfficiencyStats(limit = 20): Promise<EfficiencyResponse> {
  return fetchJSON<EfficiencyResponse>(`${API_BASE}/stats/efficiency?limit=${limit}`);
}

export interface LocationsResponse {
  geofences: { id: number; name: string; visit_count: string; avg_duration: number }[];
  addresses: { id: number; name: string; visit_count: string }[];
}

export async function fetchLocations(): Promise<LocationsResponse> {
  return fetchJSON<LocationsResponse>(`${API_BASE}/stats/locations`);
}

// ─── Commute ─────────────────────────────────────────────────────

export interface CommuteSegment {
  index: number;
  avg_speed: number;
  max_speed: number;
  avg_power: number;
  distance_km: number;
  duration_s: number;
  start_time: string | null;
  end_time: string | null;
}

export interface CommuteKPI {
  totalDuration: number;
  totalDistance: number;
  avgSpeed: number;
  maxSpeed: number;
  rangeConsumed: number;
  efficiency_pct: number;
}

export interface CommuteWait {
  start_time: string;
  end_time: string;
  duration_s: number;
  avg_position: { lat: number; lon: number } | null;
}

export interface CommuteDriveData {
  info: Record<string, unknown>;
  kpi: CommuteKPI;
  segments: (CommuteSegment | null)[];
  waits: CommuteWait[];
}

export interface CommuteCompareResponse {
  driveA: CommuteDriveData;
  driveB: CommuteDriveData;
}

export async function fetchCommuteCompare(driveA: number, driveB: number): Promise<CommuteCompareResponse> {
  return fetchJSON<CommuteCompareResponse>(`${API_BASE}/commute/compare?drive_a=${driveA}&drive_b=${driveB}`);
}
