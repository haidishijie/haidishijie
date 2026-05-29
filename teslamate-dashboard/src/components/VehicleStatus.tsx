import React from 'react';
import type { Car } from '../types/teslamate';
import { formatOdometer, formatKm, formatTemp, getBatteryBarColor } from '../utils/formatters';

interface VehicleStatusProps {
  car: Car | null;
}

const VehicleStatus: React.FC<VehicleStatusProps> = ({ car }) => {
  if (!car) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[200px] text-white/15">
        <div className="w-8 h-8 border-2 border-tm-cyan/15 border-t-tm-cyan rounded-full animate-spin" />
        <span className="text-sm">等待数据...</span>
      </div>
    );
  }

  const rows = [
    { label: '🔋 电量', value: `${car.battery_level ?? '--'}%`, color: 'text-tm-cyan glow-text-cyan' },
    { label: '◉ 里程表', value: formatOdometer(car.odometer), color: 'text-tm-cyan glow-text-cyan' },
    { label: '◎ 额定续航', value: formatKm(car.rated_battery_range_km), color: 'text-tm-green glow-text-green' },
    { label: '◎ 预估续航', value: formatKm(car.est_battery_range_km), color: 'text-tm-green glow-text-green' },
    { label: '🌡 室外温度', value: formatTemp(car.outside_temp), color: 'text-tm-orange glow-text-orange' },
    { label: '⬡ 车内温度', value: formatTemp(car.inside_temp), color: 'text-tm-orange glow-text-orange' },
    { label: '↗ 速度', value: car.speed != null ? `${Math.round(Number(car.speed))} km/h` : '---', color: 'text-tm-text' },
    { label: '⚡ 功率', value: car.power != null ? `${Number(car.power) > 0 ? '+' : ''}${Math.round(Number(car.power))} kW` : '---',
      color: car.power != null && Number(car.power) > 0 ? 'text-tm-green glow-text-green' : car.power != null && Number(car.power) < 0 ? 'text-tm-orange glow-text-orange' : 'text-tm-text-dim' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Two-column data grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col py-2 border-b border-tm-border/20">
            <span className="text-[11px] text-white/25 uppercase tracking-wider mb-1">{r.label}</span>
            <span className={`text-lg font-bold font-mono ${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Battery bar */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-white/20 shrink-0">0%</span>
        <div className="data-bar flex-1 h-3">
          <div
            className={`data-bar-fill ${getBatteryBarColor(car.battery_level)}`}
            style={{
              width: `${Number(car.battery_level) ?? 0}%`,
              boxShadow: `0 0 6px ${car.battery_level != null && Number(car.battery_level) >= 80 ? 'rgba(0,255,65,0.5)' : car.battery_level != null && Number(car.battery_level) >= 40 ? 'rgba(0,212,255,0.5)' : car.battery_level != null && Number(car.battery_level) >= 20 ? 'rgba(255,107,53,0.5)' : 'rgba(255,45,85,0.5)'}`,
            }}
          />
        </div>
        <span className="text-xs text-white/20 shrink-0">100%</span>
      </div>
    </div>
  );
};

export default VehicleStatus;
