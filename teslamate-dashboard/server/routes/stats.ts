import { Router } from 'express';
import { query, queryOne } from '../db';

const router = Router();

/** Weekly mileage stats: current week Monday-Sunday */
router.get('/weekly', async (_req, res) => {
  try {
    const result = await queryOne<{
      total_distance: number | null;
      total_duration: number | null;
      drive_count: string;
    }>(`
      SELECT
        COALESCE(SUM(distance), 0) AS total_distance,
        COALESCE(SUM(duration_min), 0) AS total_duration,
        COUNT(*)::text AS drive_count
      FROM drives
      WHERE car_id = 1
        AND start_date >= date_trunc('week', CURRENT_DATE)
        AND start_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    `);

    // Get daily breakdown for the week
    const daily = await query<{ day: string; distance: number }>(`
      SELECT
        TO_CHAR(start_date, 'Day') AS day,
        COALESCE(SUM(distance), 0) AS distance
      FROM drives
      WHERE car_id = 1
        AND start_date >= date_trunc('week', CURRENT_DATE)
        AND start_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
      GROUP BY TO_CHAR(start_date, 'Day'), date_trunc('day', start_date)
      ORDER BY date_trunc('day', start_date)
    `);

    const weekStart = await queryOne<{ week_start: string }>(
      "SELECT date_trunc('week', CURRENT_DATE)::text AS week_start"
    );

    res.json({
      weekStart: weekStart?.week_start ?? null,
      totalDistance: result?.total_distance ?? 0,
      totalDuration: result?.total_duration ?? 0,
      driveCount: parseInt(result?.drive_count ?? '0', 10),
      daily,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Monthly comparison: last 12 months */
router.get('/monthly', async (_req, res) => {
  try {
    const driveStats = await query<{
      month: string;
      distance: number;
      duration_min: number;
      drive_count: string;
      avg_speed: number;
    }>(`
      SELECT
        TO_CHAR(d.start_date, 'YYYY-MM') AS month,
        COALESCE(SUM(d.distance), 0) AS distance,
        COALESCE(SUM(d.duration_min), 0) AS duration_min,
        COUNT(*)::text AS drive_count,
        CASE
          WHEN SUM(d.duration_min) > 0
          THEN ROUND(AVG(d.speed_max)::numeric, 1)
          ELSE 0
        END AS avg_speed
      FROM drives d
      WHERE d.car_id = 1
        AND d.start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(d.start_date, 'YYYY-MM')
      ORDER BY month
    `);

    const chargeStats = await query<{
      month: string;
      energy_added: number;
      energy_used: number;
      charge_count: string;
      cost: number;
    }>(`
      SELECT
        TO_CHAR(cp.start_date, 'YYYY-MM') AS month,
        COALESCE(SUM(cp.charge_energy_added), 0) AS energy_added,
        COALESCE(SUM(cp.charge_energy_used), 0) AS energy_used,
        COUNT(*)::text AS charge_count,
        COALESCE(SUM(cp.cost), 0) AS cost
      FROM charging_processes cp
      WHERE cp.car_id = 1
        AND cp.start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(cp.start_date, 'YYYY-MM')
      ORDER BY month
    `);

    res.json({ driveStats, chargeStats });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Summary: overall stats */
router.get('/summary', async (_req, res) => {
  try {
    const [driveSummary, chargeSummary, carInfo] = await Promise.all([
      queryOne<{
        total_distance: number;
        total_duration: number;
        drive_count: string;
        avg_efficiency: number;
        max_speed: number;
        first_drive: string;
      }>(`
        SELECT
          COALESCE(SUM(distance), 0) AS total_distance,
          COALESCE(SUM(duration_min), 0) AS total_duration,
          COUNT(*)::text AS drive_count,
          CASE
            WHEN SUM(d.start_rated_range_km - d.end_rated_range_km) > 0
            THEN ROUND(
              (SUM(d.distance) / SUM(d.start_rated_range_km - d.end_rated_range_km) * 100)
              ::numeric, 1
            )
            ELSE 0
          END AS avg_efficiency,
          COALESCE(MAX(speed_max), 0) AS max_speed,
          MIN(start_date)::text AS first_drive
        FROM drives d
        WHERE d.car_id = 1
      `),
      queryOne<{
        total_energy: number;
        total_cost: number;
        charge_count: string;
        avg_energy_per_charge: number;
        fast_charge_count: string;
      }>(`
        SELECT
          COALESCE(SUM(cp.charge_energy_added), 0) AS total_energy,
          COALESCE(SUM(cp.cost), 0) AS total_cost,
          COUNT(DISTINCT cp.id)::text AS charge_count,
          CASE
            WHEN COUNT(DISTINCT cp.id) > 0
            THEN ROUND((SUM(cp.charge_energy_added) / COUNT(DISTINCT cp.id))::numeric, 1)
            ELSE 0
          END AS avg_energy_per_charge,
          COUNT(CASE WHEN c.fast_charger_present = true THEN 1 END)::text AS fast_charge_count
        FROM charging_processes cp
        LEFT JOIN charges c ON c.charging_process_id = cp.id
        WHERE cp.car_id = 1
      `),
      queryOne<{ name: string; display_name: string; odometer: number | null }>(`
        SELECT c.name, c.marketing_name AS display_name, p.odometer
        FROM cars c
        LEFT JOIN LATERAL (
          SELECT odometer FROM positions WHERE car_id = c.id ORDER BY date DESC LIMIT 1
        ) p ON true
        WHERE c.id = 1
      `),
    ]);

    res.json({
      drives: driveSummary,
      charges: chargeSummary,
      car: carInfo,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Mileage trend: aggregated by day/week/month */
router.get('/mileage', async (req, res) => {
  try {
    const groupBy = (req.query.group as string) || 'day';
    const limit = Math.min(365, Math.max(7, parseInt((req.query.limit as string) || '30', 10)));

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const mileage = await query<{ period: string; distance: number; duration_min: number; drive_count: string }>(`
      SELECT
        TO_CHAR(start_date, '${dateFormat}') AS period,
        COALESCE(SUM(distance), 0) AS distance,
        COALESCE(SUM(duration_min), 0) AS duration_min,
        COUNT(*)::text AS drive_count
      FROM drives
      WHERE car_id = 1
      GROUP BY period
      ORDER BY period DESC
      LIMIT ${limit}
    `);

    // Reverse for chronological order
    mileage.reverse();

    res.json({ mileage, groupBy });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Efficiency analysis: Wh/km per drive */
router.get('/efficiency', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));

    const efficiency = await query<{
      drive_id: number;
      date: string;
      distance: number;
      range_consumed: number;
      wh_per_km: number;
      efficiency_pct: number;
      outside_temp_avg: number;
      speed_max: number;
      duration_min: number;
    }>(`
      SELECT
        d.id AS drive_id,
        d.start_date AS date,
        d.distance,
        (d.start_rated_range_km - d.end_rated_range_km) AS range_consumed,
        CASE
          WHEN d.distance > 0 AND (d.start_rated_range_km - d.end_rated_range_km) > 0
          THEN ROUND(
            ((d.start_rated_range_km - d.end_rated_range_km) / d.distance * 1000)
            ::numeric, 1
          )
          ELSE NULL
        END AS wh_per_km,
        CASE
          WHEN (d.start_rated_range_km - d.end_rated_range_km) > 0
          THEN ROUND(
            (d.distance / (d.start_rated_range_km - d.end_rated_range_km) * 100)
            ::numeric, 1
          )
          ELSE NULL
        END AS efficiency_pct,
        d.outside_temp_avg,
        d.speed_max,
        d.duration_min
      FROM drives d
      WHERE d.car_id = 1
        AND d.distance > 0
        AND (d.start_rated_range_km - d.end_rated_range_km) > 0
      ORDER BY d.start_date DESC
      LIMIT ${limit}
    `);

    // Average efficiency
    const avgResult = await queryOne<{ avg_wh_per_km: number }>(`
      SELECT
        ROUND(
          AVG(
            (d.start_rated_range_km - d.end_rated_range_km) / d.distance * 1000
          )::numeric, 1
        ) AS avg_wh_per_km
      FROM drives d
      WHERE d.car_id = 1
        AND d.distance > 0
        AND (d.start_rated_range_km - d.end_rated_range_km) > 0
    `);

    res.json({
      efficiency,
      avgWhPerKm: avgResult?.avg_wh_per_km ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Frequently visited locations (from geofences and addresses) */
router.get('/locations', async (_req, res) => {
  try {
    // Count drives by start/end geofences
    const geofenceStats = await query<{
      id: number;
      name: string;
      visit_count: string;
      avg_duration: number;
    }>(`
      WITH all_geofences AS (
        SELECT start_geofence_id AS geofence_id, duration_min FROM drives WHERE car_id = 1 AND start_geofence_id IS NOT NULL
        UNION ALL
        SELECT end_geofence_id AS geofence_id, duration_min FROM drives WHERE car_id = 1 AND end_geofence_id IS NOT NULL
      )
      SELECT
        g.id, g.name,
        COUNT(*)::text AS visit_count,
        COALESCE(ROUND(AVG(ag.duration_min)::numeric, 0), 0) AS avg_duration
      FROM all_geofences ag
      JOIN geofences g ON ag.geofence_id = g.id
      GROUP BY g.id, g.name
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `);

    // Count drives by start/end addresses
    const addressStats = await query<{
      id: number;
      name: string;
      visit_count: string;
    }>(`
      WITH all_addresses AS (
        SELECT start_address_id AS address_id FROM drives WHERE car_id = 1 AND start_address_id IS NOT NULL AND start_geofence_id IS NULL
        UNION ALL
        SELECT end_address_id AS address_id FROM drives WHERE car_id = 1 AND end_address_id IS NOT NULL AND end_geofence_id IS NULL
      )
      SELECT
        a.id, a.display_name AS name,
        COUNT(*)::text AS visit_count
      FROM all_addresses aa
      JOIN addresses a ON aa.address_id = a.id
      GROUP BY a.id, a.display_name
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `);

    res.json({ geofences: geofenceStats, addresses: addressStats });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
