import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_HOST = process.env.DB_HOST || '192.168.28.15';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER || 'teslamate';
const DB_PASS = process.env.DB_PASS || 'secret';
const DB_NAME = process.env.DB_NAME || 'teslamate';
const PORT = parseInt(process.env.PORT || '8080', 10);

const pool = new Pool({
  host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME,
  max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000,
});

async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query(text, params);
  return r.rows as T[];
}
async function q1<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  const r = await pool.query(text, params);
  return (r.rows[0] as T) ?? null;
}

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Car
app.get('/api/car', async (_req, res) => {
  try {
    const cars = await q(`
      SELECT c.id, c.name, c.marketing_name AS display_name, c.vin, c.efficiency,
        c.model, c.trim_badging, c.inserted_at AS created_at,
        p.latitude, p.longitude, p.speed, p.power, p.elevation,
        p.battery_level, p.outside_temp, p.inside_temp,
        p.ideal_battery_range_km, p.rated_battery_range_km,
        p.est_battery_range_km, p.usable_battery_level,
        p.odometer, p.date,
        p.fan_status, p.tpms_pressure_fl, p.tpms_pressure_fr,
        p.tpms_pressure_rl, p.tpms_pressure_rr
      FROM cars c
      LEFT JOIN LATERAL (
        SELECT * FROM positions WHERE car_id = c.id ORDER BY date DESC LIMIT 1
      ) p ON true ORDER BY c.id
    `);
    res.json({ cars });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// Drives
app.get('/api/drives', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));
    const [drives, countResult] = await Promise.all([
      q(`
        SELECT d.id, d.start_date AS date, d.end_date,
          d.distance, d.duration_min, d.start_km, d.end_km,
          d.start_ideal_range_km, d.end_ideal_range_km,
          d.start_rated_range_km, d.end_rated_range_km,
          d.outside_temp_avg, d.inside_temp_avg,
          d.speed_max, d.power_max, d.power_min, d.ascent, d.descent, d.car_id,
          d.start_address_id, d.end_address_id, d.start_geofence_id, d.end_geofence_id,
          sa1.name AS start_address, sa2.name AS end_address,
          sg1.name AS start_geofence, sg2.name AS end_geofence,
          sp1.latitude AS start_lat, sp1.longitude AS start_lon,
          sp2.latitude AS end_lat, sp2.longitude AS end_lon
        FROM drives d
        LEFT JOIN addresses sa1 ON d.start_address_id = sa1.id
        LEFT JOIN addresses sa2 ON d.end_address_id = sa2.id
        LEFT JOIN geofences sg1 ON d.start_geofence_id = sg1.id
        LEFT JOIN geofences sg2 ON d.end_geofence_id = sg2.id
        LEFT JOIN positions sp1 ON d.start_position_id = sp1.id
        LEFT JOIN positions sp2 ON d.end_position_id = sp2.id
        WHERE d.car_id = 1 ORDER BY d.start_date DESC LIMIT $1 OFFSET $2
      `, [limit, offset]),
      q1<{ count: string }>('SELECT COUNT(*) AS count FROM drives WHERE car_id = 1'),
    ]);
    res.json({ drives, total: parseInt(countResult?.count ?? '0', 10), limit, offset });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/drives/:id', async (req, res) => {
  try {
    const drive = await q1(`
      SELECT d.id, d.start_date AS date, d.end_date,
        d.distance, d.duration_min, d.start_km, d.end_km,
        d.start_ideal_range_km, d.end_ideal_range_km,
        d.start_rated_range_km, d.end_rated_range_km,
        d.outside_temp_avg, d.inside_temp_avg,
        d.speed_max, d.power_max, d.power_min, d.ascent, d.descent, d.car_id,
        sa1.name AS start_address, sa2.name AS end_address,
        sg1.name AS start_geofence, sg2.name AS end_geofence,
        sp1.latitude AS start_lat, sp1.longitude AS start_lon,
        sp2.latitude AS end_lat, sp2.longitude AS end_lon
      FROM drives d
      LEFT JOIN addresses sa1 ON d.start_address_id = sa1.id
      LEFT JOIN addresses sa2 ON d.end_address_id = sa2.id
      LEFT JOIN geofences sg1 ON d.start_geofence_id = sg1.id
      LEFT JOIN geofences sg2 ON d.end_geofence_id = sg2.id
      LEFT JOIN positions sp1 ON d.start_position_id = sp1.id
      LEFT JOIN positions sp2 ON d.end_position_id = sp2.id
      WHERE d.id = $1 AND d.car_id = 1
    `, [req.params.id]);
    if (!drive) return res.status(404).json({ error: 'Drive not found' });
    res.json({ drive });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/drives/:id/positions', async (req, res) => {
  try {
    const positions = await q(`
      SELECT id, date, latitude, longitude, speed, power,
        odometer, ideal_battery_range_km, battery_level,
        outside_temp, inside_temp, elevation,
        rated_battery_range_km, est_battery_range_km,
        usable_battery_level, fan_status
      FROM positions WHERE drive_id = $1 ORDER BY date ASC
    `, [req.params.id]);
    res.json({ positions });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// Charges
app.get('/api/charges', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));
    const [charges, countResult] = await Promise.all([
      q(`
        SELECT cp.id, cp.start_date AS date, cp.end_date,
          cp.charge_energy_added, cp.charge_energy_used, cp.cost,
          cp.start_battery_level, cp.end_battery_level,
          cp.start_ideal_range_km, cp.end_ideal_range_km,
          cp.duration_min, cp.outside_temp_avg, cp.car_id
        FROM charging_processes cp WHERE cp.car_id = 1
        ORDER BY cp.start_date DESC LIMIT $1 OFFSET $2
      `, [limit, offset]),
      q1<{ count: string }>('SELECT COUNT(*) AS count FROM charging_processes WHERE car_id = 1'),
    ]);
    res.json({ charges, total: parseInt(countResult?.count ?? '0', 10), limit, offset });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/charges/:id', async (req, res) => {
  try {
    const charge = await q1(`
      SELECT cp.id, cp.start_date AS date, cp.end_date,
        cp.charge_energy_added, cp.charge_energy_used, cp.cost,
        cp.start_battery_level, cp.end_battery_level,
        cp.start_ideal_range_km, cp.end_ideal_range_km,
        cp.duration_min, cp.outside_temp_avg, cp.car_id
      FROM charging_processes cp WHERE cp.id = $1 AND cp.car_id = 1
    `, [req.params.id]);
    if (!charge) return res.status(404).json({ error: 'Charge not found' });
    const snapshots = await q(`
      SELECT c.date, c.battery_level, c.charge_energy_added,
        c.charger_actual_current, c.charger_phases, c.charger_power, c.charger_voltage,
        c.fast_charger_present, c.conn_charge_cable,
        c.ideal_battery_range_km, c.rated_battery_range_km,
        c.usable_battery_level, c.outside_temp
      FROM charges c WHERE c.charging_process_id = $1 ORDER BY c.date ASC
    `, [req.params.id]);
    res.json({ charge, snapshots });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// Stats
app.get('/api/stats/weekly', async (_req, res) => {
  try {
    const result = await q1<{ total_distance: number; total_duration: string; drive_count: string }>(`
      SELECT COALESCE(SUM(distance), 0) AS total_distance,
        COALESCE(SUM(duration_min), 0) AS total_duration,
        COUNT(*)::text AS drive_count
      FROM drives WHERE car_id = 1
        AND start_date >= date_trunc('week', CURRENT_DATE)
        AND start_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    `);
    const daily = await q(`
      SELECT TO_CHAR(start_date, 'Day') AS day,
        COALESCE(SUM(distance), 0) AS distance
      FROM drives WHERE car_id = 1
        AND start_date >= date_trunc('week', CURRENT_DATE)
        AND start_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
      GROUP BY TO_CHAR(start_date, 'Day'), date_trunc('day', start_date)
      ORDER BY date_trunc('day', start_date)
    `);
    const weekStart = await q1<{ week_start: string }>("SELECT date_trunc('week', CURRENT_DATE)::text AS week_start");
    res.json({ weekStart: weekStart?.week_start ?? null, totalDistance: result?.total_distance ?? 0, totalDuration: result?.total_duration ?? 0, driveCount: parseInt(result?.drive_count ?? '0', 10), daily });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/stats/monthly', async (_req, res) => {
  try {
    const driveStats = await q(`
      SELECT TO_CHAR(d.start_date, 'YYYY-MM') AS month,
        COALESCE(SUM(d.distance), 0) AS distance,
        COALESCE(SUM(d.duration_min), 0) AS duration_min,
        COUNT(*)::text AS drive_count,
        CASE WHEN SUM(d.duration_min) > 0 THEN ROUND(AVG(d.speed_max)::numeric, 1) ELSE 0 END AS avg_speed
      FROM drives d WHERE d.car_id = 1 AND d.start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(d.start_date, 'YYYY-MM') ORDER BY month
    `);
    const chargeStats = await q(`
      SELECT TO_CHAR(cp.start_date, 'YYYY-MM') AS month,
        COALESCE(SUM(cp.charge_energy_added), 0) AS energy_added,
        COALESCE(SUM(cp.charge_energy_used), 0) AS energy_used,
        COUNT(*)::text AS charge_count,
        COALESCE(SUM(cp.cost), 0) AS cost
      FROM charging_processes cp WHERE cp.car_id = 1 AND cp.start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(cp.start_date, 'YYYY-MM') ORDER BY month
    `);
    res.json({ driveStats, chargeStats });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/stats/summary', async (_req, res) => {
  try {
    const [driveSummary, chargeSummary, carInfo] = await Promise.all([
      q1(`
        SELECT COALESCE(SUM(distance), 0) AS total_distance,
          COALESCE(SUM(duration_min), 0) AS total_duration,
          COUNT(*)::text AS drive_count,
          CASE WHEN SUM(d.start_rated_range_km - d.end_rated_range_km) > 0
            THEN ROUND((SUM(d.distance) / SUM(d.start_rated_range_km - d.end_rated_range_km) * 100)::numeric, 1)
            ELSE 0 END AS avg_efficiency,
          COALESCE(MAX(speed_max), 0) AS max_speed,
          MIN(start_date)::text AS first_drive
        FROM drives d WHERE d.car_id = 1
      `),
      q1(`
        SELECT COALESCE(SUM(cp.charge_energy_added), 0) AS total_energy,
          COALESCE(SUM(cp.cost), 0) AS total_cost,
          COUNT(DISTINCT cp.id)::text AS charge_count,
          CASE WHEN COUNT(DISTINCT cp.id) > 0 THEN ROUND((SUM(cp.charge_energy_added) / COUNT(DISTINCT cp.id))::numeric, 1) ELSE 0 END AS avg_energy_per_charge,
          COUNT(CASE WHEN c.fast_charger_present = true THEN 1 END)::text AS fast_charge_count
        FROM charging_processes cp
        LEFT JOIN charges c ON c.charging_process_id = cp.id
        WHERE cp.car_id = 1
      `),
      q1<{ name: string; display_name: string; odometer: number | null }>(`
        SELECT c.name, c.marketing_name AS display_name, p.odometer
        FROM cars c
        LEFT JOIN LATERAL (SELECT odometer FROM positions WHERE car_id = c.id ORDER BY date DESC LIMIT 1) p ON true
        WHERE c.id = 1
      `),
    ]);
    res.json({ drives: driveSummary, charges: chargeSummary, car: carInfo });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/stats/mileage', async (req, res) => {
  try {
    const groupBy = (req.query.group as string) || 'day';
    const limit = Math.min(365, Math.max(7, parseInt((req.query.limit as string) || '30', 10)));
    let dateFormat = 'YYYY-MM-DD';
    if (groupBy === 'week') dateFormat = 'IYYY-IW';
    else if (groupBy === 'month') dateFormat = 'YYYY-MM';
    const mileage = await q(`
      SELECT TO_CHAR(start_date, '${dateFormat}') AS period,
        COALESCE(SUM(distance), 0) AS distance,
        COALESCE(SUM(duration_min), 0) AS duration_min,
        COUNT(*)::text AS drive_count
      FROM drives WHERE car_id = 1 GROUP BY period ORDER BY period DESC LIMIT ${limit}
    `);
    mileage.reverse();
    res.json({ mileage, groupBy });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/stats/efficiency', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const efficiency = await q(`
      SELECT d.id AS drive_id, d.start_date AS date, d.distance,
        (d.start_rated_range_km - d.end_rated_range_km) AS range_consumed,
        CASE WHEN d.distance > 0 AND (d.start_rated_range_km - d.end_rated_range_km) > 0
          THEN ROUND(((d.start_rated_range_km - d.end_rated_range_km) / d.distance * 1000)::numeric, 1)
          ELSE NULL END AS wh_per_km,
        CASE WHEN (d.start_rated_range_km - d.end_rated_range_km) > 0
          THEN ROUND((d.distance / (d.start_rated_range_km - d.end_rated_range_km) * 100)::numeric, 1)
          ELSE NULL END AS efficiency_pct,
        d.outside_temp_avg, d.speed_max, d.duration_min
      FROM drives d WHERE d.car_id = 1 AND d.distance > 0 AND (d.start_rated_range_km - d.end_rated_range_km) > 0
      ORDER BY d.start_date DESC LIMIT ${limit}
    `);
    const avgResult = await q1<{ avg_wh_per_km: number }>(`
      SELECT ROUND(AVG((d.start_rated_range_km - d.end_rated_range_km) / d.distance * 1000)::numeric, 1) AS avg_wh_per_km
      FROM drives d WHERE d.car_id = 1 AND d.distance > 0 AND (d.start_rated_range_km - d.end_rated_range_km) > 0
    `);
    res.json({ efficiency, avgWhPerKm: avgResult?.avg_wh_per_km ?? null });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.get('/api/stats/locations', async (_req, res) => {
  try {
    const geofenceStats = await q(`
      WITH all_geofences AS (
        SELECT start_geofence_id AS geofence_id, duration_min FROM drives WHERE car_id = 1 AND start_geofence_id IS NOT NULL
        UNION ALL
        SELECT end_geofence_id AS geofence_id, duration_min FROM drives WHERE car_id = 1 AND end_geofence_id IS NOT NULL
      )
      SELECT g.id, g.name, COUNT(*)::text AS visit_count,
        COALESCE(ROUND(AVG(ag.duration_min)::numeric, 0), 0) AS avg_duration
      FROM all_geofences ag JOIN geofences g ON ag.geofence_id = g.id
      GROUP BY g.id, g.name ORDER BY COUNT(*) DESC LIMIT 20
    `);
    const addressStats = await q(`
      WITH all_addresses AS (
        SELECT start_address_id AS address_id FROM drives WHERE car_id = 1 AND start_address_id IS NOT NULL AND start_geofence_id IS NULL
        UNION ALL
        SELECT end_address_id AS address_id FROM drives WHERE car_id = 1 AND end_address_id IS NOT NULL AND end_geofence_id IS NULL
      )
      SELECT a.id, a.display_name AS name, COUNT(*)::text AS visit_count
      FROM all_addresses aa JOIN addresses a ON aa.address_id = a.id
      GROUP BY a.id, a.display_name ORDER BY COUNT(*) DESC LIMIT 20
    `);
    res.json({ geofences: geofenceStats, addresses: addressStats });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// Commute compare
app.get('/api/commute/compare', async (req, res) => {
  try {
    const driveAId = parseInt(req.query.drive_a as string, 10);
    const driveBId = parseInt(req.query.drive_b as string, 10);
    if (!driveAId || !driveBId) return res.status(400).json({ error: 'drive_a and drive_b required' });

    const getDrive = async (id: number) => {
      const drive = await q1(`SELECT d.*, sa1.name AS start_address, sa2.name AS end_address, sg1.name AS start_geofence, sg2.name AS end_geofence FROM drives d LEFT JOIN addresses sa1 ON d.start_address_id = sa1.id LEFT JOIN addresses sa2 ON d.end_address_id = sa2.id LEFT JOIN geofences sg1 ON d.start_geofence_id = sg1.id LEFT JOIN geofences sg2 ON d.end_geofence_id = sg2.id WHERE d.id = $1 AND d.car_id = 1`, [id]);
      const positions = await q(`SELECT latitude, longitude, speed, power, battery_level, date FROM positions WHERE drive_id = $1 ORDER BY date ASC`, [id]);
      return { drive, positions };
    };

    const [dataA, dataB] = await Promise.all([getDrive(driveAId), getDrive(driveBId)]);
    if (!dataA.drive || !dataB.drive) return res.status(404).json({ error: 'Drive not found' });

    const distKm = (d: any) => d.distance ?? 0;
    const durMin = (d: any) => d.duration_min ?? 0;
    const avgSpeedKmh = (d: any) => durMin(d) > 0 ? Math.round((distKm(d) / (durMin(d) / 60)) * 10) / 10 : 0;

    const buildInfo = (d: any) => ({
      id: d.id, duration: durMin(d), distance: distKm(d), avgSpeed: avgSpeedKmh(d),
      maxSpeed: d.speed_max ?? 0, startAddress: d.start_address, endAddress: d.end_address,
      rangeConsumed: d.start_rated_range_km && d.end_rated_range_km ? Math.round((d.start_rated_range_km - d.end_rated_range_km) * 10) / 10 : null,
      efficiency: d.start_rated_range_km && d.end_rated_range_km && distKm(d) > 0 ? Math.round(distKm(d) / (d.start_rated_range_km - d.end_rated_range_km) * 100 * 10) / 10 : null,
    });

    const buildSegments = (positions: any[]) => {
      const segments: any[] = [];
      if (positions.length < 2) return segments;
      const segSize = Math.max(1, Math.floor(positions.length / 5));
      for (let i = 0; i < positions.length - 1; i += segSize) {
        const segEnd = Math.min(i + segSize, positions.length - 1);
        const seg = positions.slice(i, segEnd + 1);
        const dur = (new Date(seg[seg.length - 1].date).getTime() - new Date(seg[0].date).getTime()) / 60000;
        const avgSpeed = dur > 0 ? seg.reduce((s: number, p: any) => s + (p.speed ?? 0), 0) / seg.length : 0;
        segments.push({ index: segments.length, duration: Math.round(dur * 10) / 10, avgSpeed: Math.round(avgSpeed * 10) / 10 });
      }
      return segments;
    };

    const buildWaits = (positions: any[]) => {
      const waits: any[] = [];
      if (positions.length < 2) return waits;
      let waitStart = -1;
      for (let i = 0; i < positions.length; i++) {
        if ((positions[i].speed ?? 0) < 5) { if (waitStart < 0) waitStart = i; }
        else {
          if (waitStart >= 0 && i - waitStart >= 2) {
            const dur = (new Date(positions[i-1].date).getTime() - new Date(positions[waitStart].date).getTime()) / 1000;
            if (dur >= 30) waits.push({ index: waits.length, duration: Math.round(dur), position: waitStart });
          }
          waitStart = -1;
        }
      }
      return waits;
    };

    const infoA = buildInfo(dataA.drive);
    const infoB = buildInfo(dataB.drive);
    const segsA = buildSegments(dataA.positions);
    const segsB = buildSegments(dataB.positions);
    const waitsA = buildWaits(dataA.positions);
    const waitsB = buildWaits(dataB.positions);

    res.json({
      driveA: { info: infoA, segments: segsA, waits: waitsA },
      driveB: { info: infoB, segments: segsB, waits: waitsB },
      kpis: [
        { metric: '总时长', valueA: String(infoA.duration), valueB: String(infoB.duration), winner: infoA.duration < infoB.duration ? 'A' : 'B' },
        { metric: '平均速度', valueA: String(infoA.avgSpeed), valueB: String(infoB.avgSpeed), winner: infoA.avgSpeed > infoB.avgSpeed ? 'A' : 'B' },
        { metric: '最高速度', valueA: String(infoA.maxSpeed), valueB: String(infoB.maxSpeed), winner: infoA.maxSpeed > infoB.maxSpeed ? 'A' : 'B' },
      ],
      conclusion: {
        fasterRoute: infoA.duration < infoB.duration ? 'A' : 'B',
        bestEfficiency: (infoA.efficiency ?? 0) > (infoB.efficiency ?? 0) ? 'A' : 'B',
        totalWaitA: waitsA.reduce((s: number, w: any) => s + w.duration, 0),
        totalWaitB: waitsB.reduce((s: number, w: any) => s + w.duration, 0),
      },
    });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

// Serve static frontend files from dist/
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  TeslaMate Dashboard');
  console.log(`  Port:     ${PORT}`);
  console.log(`  Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});
