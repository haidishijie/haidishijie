import React, { useState } from 'react';
import type { Drive } from '../types/teslamate';
import { formatDate, formatKm, formatDuration } from '../utils/formatters';

interface DrivingHabitsProps {
  drives: Drive[];
}

const StatItem: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div>
    <span className="data-label">{label}</span>
    <div className={`text-lg font-bold mt-0.5 ${color}`}>{value}</div>
  </div>
);

/**
 * Driving habits panel with expandable drive list.
 */
const DrivingHabits: React.FC<DrivingHabitsProps> = ({ drives }) => {
  const [expanded, setExpanded] = useState(false);
  const totalCount = drives.length;
  const maxSpeeds = drives.map((d) => d.speed_max ?? 0);
  const topSpeed = maxSpeeds.length > 0 ? Math.max(...maxSpeeds) : 0;
  const avgTopSpeed = maxSpeeds.length > 0 ? maxSpeeds.reduce((a, b) => a + b, 0) / maxSpeeds.length : 0;
  const totalDist = drives.reduce((s, d) => s + (d.distance ?? 0), 0);
  const totalDuration = drives.reduce((s, d) => s + (d.duration_min ?? 0), 0);
  const avgSpeed = totalDuration > 0 ? (totalDist / (totalDuration / 60)) : 0;
  const totalAscent = drives.reduce((s, d) => s + (d.ascent ?? 0), 0);
  const totalDescent = drives.reduce((s, d) => s + (d.descent ?? 0), 0);
  const drivesSorted = [...drives].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="panel flex flex-col">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-tm-border/40 min-h-[36px]">
        <span className="text-[10px] text-tm-orange/60">◆</span>
        <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-white/35">驾驶习惯</h3>
        <span className="ml-auto text-[10px] text-white/20 font-mono">{totalCount} 次行程</span>
        {totalCount > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-tm-cyan/50 hover:text-tm-cyan ml-1">
            {expanded ? '收起' : '查看'}
          </button>
        )}
      </div>
      <div className="p-4">
        {totalCount === 0 ? (
          <div className="text-center py-6 text-white/15 text-xs">暂无行程数据</div>
        ) : !expanded ? (
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <StatItem label="平均速度" value={`${avgSpeed.toFixed(1)} km/h`} color="text-tm-cyan" />
              <StatItem label="最高速度" value={`${Math.round(topSpeed)} km/h`} color="text-tm-red" />
            </div>
            <div className="space-y-4">
              <StatItem label="总距离" value={`${totalDist.toFixed(0)} km`} color="text-tm-green" />
              <StatItem label="总时间" value={formatDuration(totalDuration)} color="text-tm-text" />
            </div>
            <div className="space-y-4">
              <StatItem label="总爬升" value={`${totalAscent.toFixed(0)} m`} color="text-tm-yellow" />
              <StatItem label="总下降" value={`${totalDescent.toFixed(0)} m`} color="text-tm-yellow" />
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {drivesSorted.map((d) => (
              <div key={d.id} className="flex items-center py-2 px-2 rounded border border-tm-border/20 hover:border-tm-cyan/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 text-[10px]">◉</span>
                    <span className="text-sm text-tm-text truncate">{d.start_address || d.start_geofence || '出发'}</span>
                    <span className="text-white/20">→</span>
                    <span className="text-sm text-tm-text-dim truncate">{d.end_address || d.end_geofence || '到达'}</span>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-white/30">{formatDate(d.date)}</span>
                    <span className="text-xs text-tm-cyan">{formatKm(d.distance, 0)}</span>
                    <span className="text-xs text-white/30">{formatDuration(d.duration_min)}</span>
                    {d.speed_max != null && <span className="text-xs text-tm-orange">最高 {Math.round(d.speed_max)} km/h</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrivingHabits;
