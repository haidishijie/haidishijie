import React from 'react';
import type { Car } from '../types/teslamate';
import DataCard from './DataCard';
import {
  formatSoc,
  formatKm,
  formatOdometer,
  formatTemp,
  formatPower,
  getBatteryColor,
  getBatteryBarColor,
} from '../utils/formatters';

interface VehicleStatusProps {
  car: Car | null;
}

/** Circular battery gauge SVG component */
const BatteryGauge: React.FC<{ soc: number | null }> = ({ soc }) => {
  const batteryLevel = soc ?? 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (batteryLevel / 100) * circumference;

  const color = soc != null && soc >= 80 ? '#00ff41' : soc != null && soc >= 40 ? '#00d4ff' : soc != null && soc >= 20 ? '#ff6b35' : '#ff2d55';
  const colorDim = soc != null && soc >= 80 ? 'rgba(0,255,65,0.15)' : soc != null && soc >= 40 ? 'rgba(0,212,255,0.15)' : soc != null && soc >= 20 ? 'rgba(255,107,53,0.15)' : 'rgba(255,45,85,0.15)';

  return (
    <div className="circular-gauge">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke={colorDim} strokeWidth="3" strokeDasharray="4 4" opacity="0.4" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(30,58,95,0.4)" strokeWidth="6" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="gauge-text">
        <span className={`text-3xl font-bold ${getBatteryColor(soc)}`}>{formatSoc(soc)}</span>
        <span className="text-xs text-tm-text-dim uppercase tracking-wider">电量</span>
      </div>
    </div>
  );
};

/**
 * Main vehicle status panel with battery gauge, odometer, location, and quick stats.
 */
const VehicleStatus: React.FC<VehicleStatusProps> = ({ car }) => {
  if (!car) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="text-tm-cyan">◆</span> 车辆状态
        </div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm animate-pulse">等待数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel glow-border-cyan">
      <div className="panel-header">
        <span className="text-tm-cyan">◆</span>
        <span>车辆状态</span>
        <span className="ml-auto text-xs text-tm-green glow-text-green">
          ● 已连接
        </span>
      </div>
      <div className="panel-body">
        <div className="flex gap-6 items-start">
          {/* Battery Gauge */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <BatteryGauge soc={car.battery_level} />
            <div className="text-center">
              <div className="text-xs text-tm-text-dim">
                可用: <span className="text-tm-text">{formatSoc(car.usable_battery_level)}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-4">
            <DataCard label="里程表" value={formatOdometer(car.odometer)} colorClass="text-tm-cyan glow-text-cyan" icon="◉" />
            <DataCard label="额定续航" value={formatKm(car.rated_battery_range_km)} colorClass="text-tm-green glow-text-green" icon="◎" />
            <DataCard label="理想续航" value={formatKm(car.ideal_battery_range_km)} colorClass="text-tm-green glow-text-green" icon="◎" />
            <DataCard label="预估续航" value={formatKm(car.est_battery_range_km)} colorClass="text-tm-cyan glow-text-cyan" icon="◎" />
            <DataCard label="室外温度" value={formatTemp(car.outside_temp)} colorClass="text-tm-orange glow-text-orange" icon="🌡" />
            <DataCard label="车内温度" value={formatTemp(car.inside_temp)} colorClass="text-tm-orange glow-text-orange" icon="⬡" />
          </div>
        </div>

        {/* Bottom Bar: Speed, Power, Location */}
        <div className="mt-4 pt-3 border-t border-tm-border/50 grid grid-cols-4 gap-4">
          <DataCard
            label="速度"
            value={car.speed != null ? `${Math.round(Number(car.speed))}` : '---'}
            unit="km/h"
            colorClass="text-tm-text"
            icon="↗"
          />
          <DataCard
            label="功率"
            value={car.power != null ? (Number(car.power) > 0 ? '+' : '') + Math.round(Number(car.power)) : '---'}
            unit="kW"
            colorClass={car.power != null && Number(car.power) > 0 ? 'text-tm-green glow-text-green' : car.power != null && Number(car.power) < 0 ? 'text-tm-orange glow-text-orange' : 'text-tm-text-dim'}
            icon="⚡"
          />
          <DataCard
            label="纬度"
            value={car.latitude != null ? Number(car.latitude).toFixed(5) : '---'}
            colorClass="text-tm-text-dim"
            icon="⊕"
          />
          <DataCard
            label="经度"
            value={car.longitude != null ? Number(car.longitude).toFixed(5) : '---'}
            colorClass="text-tm-text-dim"
            icon="⊕"
          />
        </div>

        {/* Battery bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-tm-text-dim shrink-0">0%</span>
          <div className="data-bar flex-1">
            <div
              className={`data-bar-fill ${getBatteryBarColor(car.battery_level)}`}
              style={{
                width: `${Number(car.battery_level) ?? 0}%`,
                boxShadow: `0 0 6px ${car.battery_level != null && Number(car.battery_level) >= 80 ? 'rgba(0,255,65,0.5)' : car.battery_level != null && Number(car.battery_level) >= 40 ? 'rgba(0,212,255,0.5)' : car.battery_level != null && Number(car.battery_level) >= 20 ? 'rgba(255,107,53,0.5)' : 'rgba(255,45,85,0.5)'}`,
              }}
            />
          </div>
          <span className="text-xs text-tm-text-dim shrink-0">100%</span>
        </div>
      </div>
    </div>
  );
};

export default VehicleStatus;
