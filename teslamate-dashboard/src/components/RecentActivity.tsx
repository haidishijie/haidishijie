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
      title: d.start_address ?? d.start_geofence ?? 'Drive',
      subtitle: `${d.end_address ?? d.end_geofence ?? 'Destination'}`,
      metric: `${formatKm(d.distance, 0)} · ${formatDuration(d.duration_min)}`,
      color: 'text-tm-orange',
      dotColor: 'bg-tm-orange',
    })),
    ...charges.slice(0, 10).map((c) => ({
      id: `c${c.id}`,
      type: 'charge' as const,
      date: c.date,
      title: 'Charge Session',
      subtitle: c.start_battery_level != null && c.end_battery_level != null
        ? `${c.start_battery_level}% → ${c.end_battery_level}%`
        : '',
      metric: `${(c.charge_energy_added ?? 0).toFixed(1)} kWh · ${formatDuration(c.duration_min)}`,
      color: 'text-tm-green',
      dotColor: 'bg-tm-green',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-yellow">◆</span> 最近活动
        <span className="ml-auto text-xs text-tm-text-dim">{items.length} 条事件</span>
      </div>
      <div className="panel-body flex-1 overflow-y-auto" style={{ maxHeight: '320px' }}>
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <span className="text-tm-text-dim text-sm">暂无活动记录</span>
          </div>
        ) : (
          <div className="space-y-0">
            {items.map((item, idx) => (
              <div key={item.id} className="flex gap-3 py-2.5 border-b border-tm-border/20 last:border-0">
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center shrink-0 w-4">
                  <div className={`w-2 h-2 rounded-full ${item.dotColor} ${idx === 0 ? 'animate-pulse' : ''}`} />
                  {idx < items.length - 1 && <div className="flex-1 w-px bg-tm-border/40 mt-1" />}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${item.color} truncate`}>
                      {item.type === 'drive' ? '◉' : '⚡'} {item.title}
                    </span>
                    <span className="text-xs text-tm-text-dim shrink-0 ml-2">{formatDate(item.date)}</span>
                  </div>
                  <div className="text-xs text-tm-text-dim mt-0.5">{item.subtitle}</div>
                  <div className="text-xs text-tm-text mt-0.5">{item.metric}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
