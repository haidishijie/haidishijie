const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "teslamate-database-1",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "teslamate",
  password: process.env.DB_PASS || "secret",
  database: process.env.DB_NAME || "teslamate",
  max: 3,
  connectionTimeoutMillis: 3000,
});

async function query(sql, params) {
  const r = await pool.query(sql, params);
  return r.rows;
}

module.exports = [
  {
    name: "车况",
    description: "查看车辆当前状态",
    handler: async () => {
      try {
        const rows = await query(
          "SELECT c.name, p.battery_level, p.ideal_battery_range_km, p.odometer, " +
          "p.outside_temp, p.inside_temp, p.speed, p.power " +
          "FROM cars c LEFT JOIN LATERAL (SELECT * FROM positions WHERE car_id = c.id " +
          "ORDER BY date DESC LIMIT 1) p ON true WHERE c.id = 1"
        );
        const c = rows[0];
        if (!c) return "暂无车辆数据";
        let m = "\uD83D\uDE97 " + c.name + "\n";
        m += "电量: " + c.battery_level + "%\n";
        m += "续航: " + Number(c.ideal_battery_range_km).toFixed(0) + " km\n";
        m += "里程: " + Number(c.odometer).toFixed(0) + " km\n";
        m += "温度: 室外 " + c.outside_temp + "\u00B0C / 车内 " + c.inside_temp + "\u00B0C\n";
        if (Number(c.power) > 0) {
          m += "\u26A1 充电中: " + c.power + " kW";
        } else if (Number(c.power) < 0) {
          m += "\U0001F50B 行驶中: " + c.power + " kW";
        } else {
          m += "\u23F8 静止";
        }
        return m;
      } catch (e) {
        return "查询出错: " + e.message;
      }
    },
  },
  {
    name: "充电",
    description: "查看充电状态",
    handler: async () => {
      try {
        const rows = await query(
          "SELECT * FROM charging_processes WHERE car_id = 1 " +
          "AND end_date IS NULL ORDER BY start_date DESC LIMIT 1"
        );
        const p = rows[0];
        if (!p) return "暂无进行中的充电";
        const srows = await query(
          "SELECT * FROM charges WHERE charging_process_id = $1 " +
          "ORDER BY date DESC LIMIT 1",
          [p.id]
        );
        const s = srows[0];
        if (!s) return "正在充电中, 暂无详细数据";
        return (
          "\u26A1 正在充电\n" +
          "电量: " + s.battery_level + "%\n" +
          "已充入: " + Number(s.charge_energy_added).toFixed(1) + " kWh\n" +
          "功率: " + s.charger_power + " kW / " + s.charger_voltage + " V / " +
          s.charger_actual_current + " A"
        );
      } catch (e) {
        return "查询出错: " + e.message;
      }
    },
  },
  {
    name: "行程",
    description: "查看最近行程",
    handler: async () => {
      try {
        const d = await query(
          "SELECT d.start_date, d.distance, d.duration_min, d.speed_max, " +
          "sa1.name AS sa, sa2.name AS ea, sg1.name AS sg, sg2.name AS eg " +
          "FROM drives d LEFT JOIN addresses sa1 ON d.start_address_id = sa1.id " +
          "LEFT JOIN addresses sa2 ON d.end_address_id = sa2.id " +
          "LEFT JOIN geofences sg1 ON d.start_geofence_id = sg1.id " +
          "LEFT JOIN geofences sg2 ON d.end_geofence_id = sg2.id " +
          "WHERE d.car_id = 1 ORDER BY d.start_date DESC LIMIT 5"
        );
        if (!d.length) return "暂无行程";
        return d
          .map(function (x) {
            var a = x.sa || x.sg || "?";
            var b = x.ea || x.eg || "?";
            return (
              "\uD83D\uDE97 " + a + " \u2192 " + b + "\n" +
              "距离: " + Number(x.distance).toFixed(1) + " km / " +
              "时长: " + Math.round(x.duration_min) + " min / " +
              "极速: " + x.speed_max + " km/h"
            );
          })
          .join("\n---\n");
      } catch (e) {
        return "查询出错: " + e.message;
      }
    },
  },
];
