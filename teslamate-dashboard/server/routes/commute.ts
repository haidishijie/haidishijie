import { Router } from 'express';
import { query } from '../db';

const router = Router();

/**
 * Commute compare: compare two drives (outbound vs return).
 * Query params: ?drive_a=1&drive_b=2
 *
 * Returns KPIs, segment breakdowns (by time intervals), and analysis.
 */
router.get('/compare', async (req, res) => {
  try {
    const driveA = parseInt(req.query.drive_a as string, 10);
    const driveB = parseInt(req.query.drive_b as string, 10);

    if (!driveA || !driveB) {
      return res.status(400).json({ error: 'drive_a and drive_b are required' });
    }

    const [drivesA, drivesB] = await Promise.all([
      query(`
        SELECT
          d.id, d.start_date AS date, d.end_date,
          d.distance, d.duration_min, d.speed_max, d.power_max, d.power_min,
          d.start_rated_range_km, d.end_rated_range_km,
          d.outside_temp_avg, d.ascent, d.descent,
          sa.name AS start_address, ea.name AS end_address
        FROM drives d
        LEFT JOIN addresses sa ON d.start_address_id = sa.id
        LEFT JOIN addresses ea ON d.end_address_id = ea.id
        WHERE d.id = $1
      `, [driveA]),
      query(`
        SELECT
          d.id, d.start_date AS date, d.end_date,
          d.distance, d.duration_min, d.speed_max, d.power_max, d.power_min,
          d.start_rated_range_km, d.end_rated_range_km,
          d.outside_temp_avg, d.ascent, d.descent,
          sa.name AS start_address, ea.name AS end_address
        FROM drives d
        LEFT JOIN addresses sa ON d.start_address_id = sa.id
        LEFT JOIN addresses ea ON d.end_address_id = ea.id
        WHERE d.id = $1
      `, [driveB]),
    ]);

    const a = drivesA[0];
    const b = drivesB[0];

    if (!a || !b) {
      return res.status(404).json({ error: 'One or both drives not found' });
    }

    // Get positions for segment analysis
    const [posA, posB] = await Promise.all([
      query<{ date: string; speed: number | null; power: number | null; battery_level: number | null; latitude: number; longitude: number; odometer: number | null }>(
        'SELECT date, speed, power, battery_level, latitude, longitude, odometer FROM positions WHERE drive_id = $1 ORDER BY date ASC',
        [driveA],
      ),
      query<{ date: string; speed: number | null; power: number | null; battery_level: number | null; latitude: number; longitude: number; odometer: number | null }>(
        'SELECT date, speed, power, battery_level, latitude, longitude, odometer FROM positions WHERE drive_id = $1 ORDER BY date ASC',
        [driveB],
      ),
    ]);

    // Split drives into segments (5-minute intervals) for comparison
    const SEGMENT_MINUTES = 5;
    const segmentsA = splitIntoSegments(posA, SEGMENT_MINUTES);
    const segmentsB = splitIntoSegments(posB, SEGMENT_MINUTES);

    // Pad shorter drive segments with nulls
    const maxSegments = Math.max(segmentsA.length, segmentsB.length);
    while (segmentsA.length < maxSegments) segmentsA.push(null);
    while (segmentsB.length < maxSegments) segmentsB.push(null);

    // Compute KPIs
    const kpiA = computeKPI(a, segmentsA);
    const kpiB = computeKPI(b, segmentsB);

    // Detect waiting periods (speed < 5 km/h for > 30 seconds)
    const waitsA = detectWaiting(posA);
    const waitsB = detectWaiting(posB);

    res.json({
      driveA: { info: a, kpi: kpiA, segments: segmentsA, waits: waitsA },
      driveB: { info: b, kpi: kpiB, segments: segmentsB, waits: waitsB },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

interface Segment {
  index: number;
  avg_speed: number;
  max_speed: number;
  avg_power: number;
  distance_km: number;
  duration_s: number;
  start_time: string | null;
  end_time: string | null;
}

interface KPI {
  totalDuration: number;
  totalDistance: number;
  avgSpeed: number;
  maxSpeed: number;
  rangeConsumed: number;
  efficiency_pct: number;
}

function splitIntoSegments(positions: { date: string; speed: number | null; power: number | null; battery_level: number | null; latitude: number; longitude: number; odometer: number | null }[], segmentMinutes: number): (Segment | null)[] {
  if (positions.length < 2) return [];

  const startTime = new Date(positions[0].date).getTime();
  const segmentMs = segmentMinutes * 60 * 1000;
  const segments: (Segment | null)[] = [];

  let i = 0;
  for (let segIdx = 0; segIdx < 200; segIdx++) {
    const segStart = startTime + segIdx * segmentMs;
    const segEnd = segStart + segmentMs;

    const segPositions = positions.filter((p) => {
      const t = new Date(p.date).getTime();
      return t >= segStart && t < segEnd;
    });

    if (segPositions.length === 0 && new Date(positions[i]?.date ?? '').getTime() >= segEnd) {
      segments.push(null);
      continue;
    }

    if (segPositions.length < 2) continue;

    const speeds = segPositions.map((p) => p.speed ?? 0).filter((s) => s >= 0);
    const powers = segPositions.map((p) => p.power ?? 0);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgPower = powers.length > 0 ? powers.reduce((a, b) => a + b, 0) / powers.length : 0;

    // Distance from odometer delta or lat/lon
    const firstOdo = segPositions[0].odometer;
    const lastOdo = segPositions[segPositions.length - 1].odometer;
    const distanceKm = (firstOdo != null && lastOdo != null)
      ? Math.abs(lastOdo - firstOdo)
      : computeDistanceFromCoords(segPositions);

    const durationS = (new Date(segPositions[segPositions.length - 1].date).getTime() - new Date(segPositions[0].date).getTime()) / 1000;

    segments.push({
      index: segIdx,
      avg_speed: Math.round(avgSpeed * 10) / 10,
      max_speed: Math.round(maxSpeed),
      avg_power: Math.round(avgPower * 10) / 10,
      distance_km: Math.round(distanceKm * 100) / 100,
      duration_s: Math.round(durationS),
      start_time: segPositions[0].date,
      end_time: segPositions[segPositions.length - 1].date,
    });

    i += segPositions.length;
    if (i >= positions.length) break;
  }

  return segments;
}

function computeDistanceFromCoords(positions: { latitude: number; longitude: number }[]): number {
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    const lat1 = positions[i - 1].latitude * Math.PI / 180;
    const lat2 = positions[i].latitude * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = (positions[i].longitude - positions[i - 1].longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    total += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

function computeKPI(drive: Record<string, unknown>, segments: (Segment | null)[]): KPI {
  const totalDuration = Number(drive.duration_min ?? 0);
  const totalDistance = Number(drive.distance ?? 0);
  const startRange = Number(drive.start_rated_range_km ?? 0);
  const endRange = Number(drive.end_rated_range_km ?? 0);
  const rangeConsumed = Math.max(0, startRange - endRange);
  const efficiencyPct = rangeConsumed > 0 && totalDistance > 0
    ? (totalDistance / rangeConsumed) * 100
    : 0;

  const validSegments = segments.filter((s): s is Segment => s !== null);
  const avgSpeed = validSegments.length > 0
    ? validSegments.reduce((sum, s) => sum + s.avg_speed, 0) / validSegments.length
    : 0;

  return {
    totalDuration: Math.round(totalDuration),
    totalDistance: Math.round(totalDistance * 10) / 10,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    maxSpeed: Number(drive.speed_max ?? 0),
    rangeConsumed: Math.round(rangeConsumed * 10) / 10,
    efficiency_pct: Math.round(efficiencyPct * 10) / 10,
  };
}

interface WaitPeriod {
  start_time: string;
  end_time: string;
  duration_s: number;
  avg_position: { lat: number; lon: number } | null;
}

function detectWaiting(positions: { date: string; speed: number | null; latitude: number; longitude: number }[]): WaitPeriod[] {
  const SPEED_THRESHOLD = 5; // km/h
  const MIN_WAIT_S = 30;
  const waits: WaitPeriod[] = [];
  let waitStart: string | null = null;
  let waitPositions: typeof positions = [];

  for (const p of positions) {
    const speed = p.speed ?? 0;
    if (speed < SPEED_THRESHOLD) {
      if (!waitStart) {
        waitStart = p.date;
        waitPositions = [p];
      } else {
        waitPositions.push(p);
      }
    } else {
      if (waitStart) {
        const durationS = (new Date(p.date).getTime() - new Date(waitStart).getTime()) / 1000;
        if (durationS >= MIN_WAIT_S) {
          const avgLat = waitPositions.reduce((s, wp) => s + wp.latitude, 0) / waitPositions.length;
          const avgLon = waitPositions.reduce((s, wp) => s + wp.longitude, 0) / waitPositions.length;
          waits.push({
            start_time: waitStart,
            end_time: p.date,
            duration_s: Math.round(durationS),
            avg_position: { lat: Math.round(avgLat * 10000) / 10000, lon: Math.round(avgLon * 10000) / 10000 },
          });
        }
        waitStart = null;
        waitPositions = [];
      }
    }
  }

  return waits;
}

export default router;
