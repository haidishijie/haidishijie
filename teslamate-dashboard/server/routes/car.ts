import { Router } from 'express';
import { query, queryOne } from '../db';

const router = Router();

/** Get car's latest status: car info + latest position */
router.get('/car', async (_req, res) => {
  try {
    const cars = await query(`
      SELECT
        c.id, c.name, c.marketing_name AS display_name, c.vin, c.efficiency,
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
        SELECT * FROM positions
        WHERE car_id = c.id
        ORDER BY date DESC
        LIMIT 1
      ) p ON true
      ORDER BY c.id
    `);

    res.json({ cars });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Get drives list with pagination */
router.get('/drives', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

    const [drives, countResult] = await Promise.all([
      query(`
        SELECT
          d.id, d.start_date AS date, d.end_date,
          d.distance, d.duration_min, d.start_km, d.end_km,
          d.start_ideal_range_km, d.end_ideal_range_km,
          d.start_rated_range_km, d.end_rated_range_km,
          d.outside_temp_avg, d.inside_temp_avg,
          d.speed_max, d.power_max, d.power_min,
          d.ascent, d.descent,
          d.car_id, d.start_address_id, d.end_address_id,
          d.start_geofence_id, d.end_geofence_id,
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
        WHERE d.car_id = 1
        ORDER BY d.start_date DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      queryOne<{ count: string }>('SELECT COUNT(*) AS count FROM drives WHERE car_id = 1'),
    ]);

    res.json({
      drives,
      total: parseInt(countResult?.count ?? '0', 10),
      limit,
      offset,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Get single drive detail */
router.get('/drives/:id', async (req, res) => {
  try {
    const drive = await queryOne(`
      SELECT
        d.id, d.start_date AS date, d.end_date,
        d.distance, d.duration_min, d.start_km, d.end_km,
        d.start_ideal_range_km, d.end_ideal_range_km,
        d.start_rated_range_km, d.end_rated_range_km,
        d.outside_temp_avg, d.inside_temp_avg,
        d.speed_max, d.power_max, d.power_min,
        d.ascent, d.descent,
        d.car_id,
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

    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    res.json({ drive });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Get drive GPS trajectory (positions) */
router.get('/drives/:id/positions', async (req, res) => {
  try {
    const positions = await query(`
      SELECT
        id, date, latitude, longitude, speed, power,
        odometer, ideal_battery_range_km, battery_level,
        outside_temp, inside_temp, elevation,
        rated_battery_range_km, est_battery_range_km,
        usable_battery_level, fan_status
      FROM positions
      WHERE drive_id = $1
      ORDER BY date ASC
    `, [req.params.id]);

    res.json({ positions });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Get charges list */
router.get('/charges', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

    const [charges, countResult] = await Promise.all([
      query(`
        SELECT
          cp.id, cp.start_date AS date, cp.end_date,
          cp.charge_energy_added, cp.charge_energy_used, cp.cost,
          cp.start_battery_level, cp.end_battery_level,
          cp.start_ideal_range_km, cp.end_ideal_range_km,
          cp.duration_min, cp.outside_temp_avg,
          cp.car_id
        FROM charging_processes cp
        WHERE cp.car_id = 1
        ORDER BY cp.start_date DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      queryOne<{ count: string }>('SELECT COUNT(*) AS count FROM charging_processes WHERE car_id = 1'),
    ]);

    res.json({
      charges,
      total: parseInt(countResult?.count ?? '0', 10),
      limit,
      offset,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Get single charge detail with process data */
router.get('/charges/:id', async (req, res) => {
  try {
    const charge = await queryOne(`
      SELECT
        cp.id, cp.start_date AS date, cp.end_date,
        cp.charge_energy_added, cp.charge_energy_used, cp.cost,
        cp.start_battery_level, cp.end_battery_level,
        cp.start_ideal_range_km, cp.end_ideal_range_km,
        cp.duration_min, cp.outside_temp_avg,
        cp.car_id
      FROM charging_processes cp
      WHERE cp.id = $1 AND cp.car_id = 1
    `, [req.params.id]);

    if (!charge) {
      return res.status(404).json({ error: 'Charge not found' });
    }

    // Get individual charge snapshots
    const snapshots = await query(`
      SELECT
        c.date, c.battery_level, c.charge_energy_added,
        c.charger_actual_current, c.charger_phases,
        c.charger_power, c.charger_voltage,
        c.fast_charger_present, c.conn_charge_cable,
        c.ideal_battery_range_km, c.rated_battery_range_km,
        c.usable_battery_level, c.outside_temp
      FROM charges c
      WHERE c.charging_process_id = $1
      ORDER BY c.date ASC
    `, [req.params.id]);

    res.json({ charge, snapshots });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
