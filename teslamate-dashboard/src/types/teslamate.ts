/** TeslaMate data types matching PostgreSQL database schema */

export interface Position {
  id: number;
  date: string;
  odometer: number | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  power: number | null;
  elevation: number | null;
  battery_level: number | null;
  outside_temp: number | null;
  inside_temp: number | null;
  ideal_battery_range_km: number | null;
  rated_battery_range_km: number | null;
  est_battery_range_km: number | null;
  usable_battery_level: number | null;
  fan_status: number | null;
}

export interface Car {
  id: number;
  name: string;
  display_name: string;
  vin: string | null;
  efficiency: number | null;
  model: string | null;
  trim_badging: string | null;
  created_at: string | null;
  // From latest position
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  power: number | null;
  elevation: number | null;
  battery_level: number | null;
  outside_temp: number | null;
  inside_temp: number | null;
  ideal_battery_range_km: number | null;
  rated_battery_range_km: number | null;
  est_battery_range_km: number | null;
  usable_battery_level: number | null;
  odometer: number | null;
  heading: number | null;
  date: string | null;
  fan_status: number | null;
  tpms_pressure_fl: number | null;
  tpms_pressure_fr: number | null;
  tpms_pressure_rl: number | null;
  tpms_pressure_rr: number | null;
}

export interface Drive {
  id: number;
  date: string;
  end_date: string | null;
  distance: number | null;
  duration_min: number | null;
  start_km: number | null;
  end_km: number | null;
  start_ideal_range_km: number | null;
  end_ideal_range_km: number | null;
  start_rated_range_km: number | null;
  end_rated_range_km: number | null;
  outside_temp_avg: number | null;
  inside_temp_avg: number | null;
  speed_max: number | null;
  power_max: number | null;
  power_min: number | null;
  ascent: number | null;
  descent: number | null;
  car_id: number;
  start_address_id: number | null;
  end_address_id: number | null;
  start_geofence_id: number | null;
  end_geofence_id: number | null;
  start_address: string | null;
  end_address: string | null;
  start_geofence: string | null;
  end_geofence: string | null;
  start_lat: number | null;
  start_lon: number | null;
  end_lat: number | null;
  end_lon: number | null;
}

export interface Charge {
  id: number;
  date: string;
  end_date: string | null;
  charge_energy_added: number | null;
  charge_energy_used: number | null;
  start_battery_level: number | null;
  end_battery_level: number | null;
  start_ideal_range_km: number | null;
  end_ideal_range_km: number | null;
  start_rated_range_km: number | null;
  end_rated_range_km: number | null;
  duration_min: number | null;
  outside_temp_avg: number | null;
  car_id: number;
  cost: number | null;
  is_dc: boolean;
}
