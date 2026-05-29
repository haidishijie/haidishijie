import React from 'react';
import type { Drive, Charge } from '../types/teslamate';
import { formatDate, formatKm, formatDuration } from '../utils/formatters';

interface RecentActivityProps {
  drives: Drive[];
  charges: Charge[];
}

interface ActivityItem {
  id: string;
  type: 'drive' | 'charge';
  date: string;
  title: string;
  subtitle: string;
  metric: string;
  detail: string;
  color: string;
  dotColor: string;
}

/**
 * Recent activity timeline: interleaved drives and charges sorted by date.
 */
const RecentActivity: React.FC<RecentActivityProps> = ({ drives, charges }) => {
  const items: ActivityItem[] = [
    ...drives.slice(0, 10).map((d) => ({
      id: `d${d.id}`,
      type: 'drive' as const,
      date: d.date,
      title: d.start_address ?? d.start_geofence ?? '出发',
      subtitle: `→ ${d.end_address ?? d.end_geofence ?? '到达'}`,
      metric: `${formatKm(d.distance, 0)} · ${formatDuration(d.duration_min)}`,
      detail: d.speed_max != null ? `最高 ${Math.round(d.speed_max)} km/h` : '',
      color: 'text-orange-400',
      dotColor: 'bg-orange-400',
    })),
    ...charges.slice(0, 10).map((c) => ({
      id: `c${c.id}`,
      type: 'charge' as const,
      date: c.date,
      title: '充电',
      subtitle: c.start_battery_level != null && c.end_battery_level != null
        ? `${c.start_battery_level}% → ${c.end_battery_level}%`
        : '',
      metric: `${(c.charge_energy_added ?? 0).toFixed(1)} kWh`,
      detail: formatDuration(c.duration_min),
      color: 'text-green-400',
      dotColor: 'bg-green-400',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="panel h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-tm-border/40 min-h-[36px]">
        <span className="text-[10px] text-tm-yellow/60">◆</span>
        <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-white/35">最近活动</h3>
        <span className="ml-auto text-[10px] text-white/20 font-mono">{items.length} 条事件</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/15 text-sm">暂无活动记录</div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id} className="flex gap-3 py-3 px-3 rounded border border-tm-border/10 hover:border-tm-border/40 transition-colors">
              {/* Timeline dot */}
              <div className="flex flex-col items-center shrink-0 w-4 pt-0.5">
                <div className={`w-3 h-3 rounded-full ${item.dotColor} ${idx === 0 ? 'animate-pulse shadow-[0_0_6px_rgba(0,212,255,0.4)]' : ''}`} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${item.color}`}>
                    {item.type === 'drive' ? '◉' : '⚡'} {item.title}
                  </span>
                  <span className="text-sm text-white/30 font-mono">{formatDate(item.date)}</span>
                </div>
                <div className="text-sm text-white/40 mt-0.5">{item.subtitle}</div>
                <div className="flex gap-4 mt-1.5">
                  <span className={`text-sm font-medium ${item.type === 'drive' ? 'text-tm-cyan' : 'text-tm-green'}`}>
                    {item.metric}
                  </span>
                  {item.detail && <span className="text-sm text-white/30">{item.detail}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
