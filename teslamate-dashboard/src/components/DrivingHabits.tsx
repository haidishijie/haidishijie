import React from 'react';
import type { Drive } from '../types/teslamate';
import { formatDuration } from '../utils/formatters';

interface DrivingHabitsProps {
  drives: Drive[];
}

/**
 * Driving habits panel: average speed, top speed, acceleration analysis.
 */
const DrivingHabits: React.FC<DrivingHabitsProps> = ({ drives }) => {
  const totalCount = drives.length;
  const maxSpeeds = drives.map((d) => d.speed_max ?? 0);
  const topSpeed = maxSpeeds.length > 0 ? Math.max(...maxSpeeds) : 0;
  const avgTopSpeed = maxSpeeds.length > 0 ? maxSpeeds.reduce((a, b) => a + b, 0) / maxSpeeds.length : 0;

  const totalDist = drives.reduce((s, d) => s + (d.distance ?? 0), 0);
  const totalDuration = drives.reduce((s, d) => s + (d.duration_min ?? 0), 0);
  const avgSpeed = totalDuration > 0 ? (totalDist / (totalDuration / 60)) : 0;

  const totalAscent = drives.reduce((s, d) => s + (d.ascent ?? 0), 0);
  const totalDescent = drives.reduce((s, d) => s + (d.descent ?? 0), 0);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-orange">◆</span> 驾驶习惯
        <span className="ml-auto text-xs text-tm-text-dim">{totalCount} 次行程</span>
      </div>
      <div className="panel-body flex-1">
        {totalCount === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <span className="text-tm-text-dim text-sm">暂无行程数据</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <StatItem label="平均速度" value={`${avgSpeed.toFixed(1)} km/h`} color="text-tm-cyan glow-text-cyan" />
              <StatItem label="最高速度" value={`${Math.round(topSpeed)} km/h`} color="text-tm-red" />
              <StatItem label="平均最高速度" value={`${Math.round(avgTopSpeed)} km/h`} color="text-tm-orange glow-text-orange" />
            </div>
            <div className="space-y-4">
              <StatItem label="总距离" value={`${totalDist.toFixed(0)} km`} color="text-tm-green glow-text-green" />
              <StatItem label="总时间" value={formatDuration(totalDuration)} color="text-tm-text" />
              <StatItem label="平均行程距离" value={totalCount > 0 ? `${(totalDist / totalCount).toFixed(1)} km` : '---'} color="text-tm-cyan glow-text-cyan" />
            </div>
            <div className="space-y-4">
              <StatItem label="总爬升" value={`${totalAscent.toFixed(0)} m`} color="text-tm-yellow" />
              <StatItem label="总下降" value={`${totalDescent.toFixed(0)} m`} color="text-tm-yellow" />
              <StatItem label="行程" value={totalCount.toString()} color="text-tm-text-dim" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div>
    <span className="data-label">{label}</span>
    <div className={`text-lg font-bold mt-0.5 ${color}`}>{value}</div>
  </div>
);

export default DrivingHabits;
