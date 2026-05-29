/**
 * Legacy TripHistory component — kept for backward compatibility.
 * Data now comes from the PostgreSQL backend API.
 */
import React from 'react';
import type { Drive } from '../types/teslamate';
import { formatDate, formatDuration, formatKm } from '../utils/formatters';

interface TripHistoryProps {
  drives: Drive[];
}

/**
 * Trip/drive history list showing recent drives.
 */
const TripHistory: React.FC<TripHistoryProps> = ({ drives }) => {
  if (drives.length === 0) {
    return (
      <div className="panel h-full">
        <div className="panel-header">
          <span className="text-tm-orange">◆</span> 行程历史
        </div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">暂无行程数据</span>
        </div>
      </div>
    );
  }

  const sorted = [...drives].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-orange">◆</span>
        <span>行程历史</span>
        <span className="ml-auto text-xs text-tm-text-dim">{drives.length} 次行程</span>
      </div>
      <div className="panel-body flex-1 overflow-y-auto" style={{ maxHeight: '320px' }}>
        <div className="space-y-0">
          {sorted.slice(0, 20).map((d) => {
            const rangeUsed = (d.start_rated_range_km ?? 0) - (d.end_rated_range_km ?? 0);
            const eff = rangeUsed > 0 && (d.distance ?? 0) > 0
              ? ((d.distance ?? 0) / rangeUsed * 100).toFixed(1)
              : null;
            return (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-tm-border/20 last:border-0">
                <div className="flex-1">
                  <div className="text-xs text-tm-orange font-bold">
                    {formatKm(d.distance, 0)}
                  </div>
                  <div className="text-xs text-tm-text-dim">
                    {d.start_address || d.start_geofence || 'Unknown'} → {d.end_address || d.end_geofence || 'Unknown'}
                  </div>
                  <div className="text-xs text-tm-text-dim">
                    {formatDate(d.date)} · {formatDuration(d.duration_min)} · {d.speed_max ?? 0} km/h
                  </div>
                </div>
                <div className="text-right">
                  {eff != null && (
                    <div className={`text-xs ${parseFloat(eff) >= 100 ? 'text-tm-green glow-text-green' : 'text-tm-orange glow-text-orange'}`}>
                      {eff}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TripHistory;
