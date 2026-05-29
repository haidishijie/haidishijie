/**
 * Legacy ChargeHistory component — kept for backward compatibility.
 * Data now comes from the PostgreSQL backend API.
 */
import React from 'react';
import type { Charge } from '../types/teslamate';
import { formatDate, formatDuration } from '../utils/formatters';

interface ChargeHistoryProps {
  charges: Charge[];
}

/**
 * Charge history list showing recent charge sessions.
 */
const ChargeHistory: React.FC<ChargeHistoryProps> = ({ charges }) => {
  if (charges.length === 0) {
    return (
      <div className="panel h-full">
        <div className="panel-header">
          <span className="text-tm-green">◆</span> 充电历史
        </div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">暂无充电数据</span>
        </div>
      </div>
    );
  }

  const sorted = [...charges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-green">◆</span>
        <span>充电历史</span>
        <span className="ml-auto text-xs text-tm-text-dim">{charges.length} 次充电</span>
      </div>
      <div className="panel-body flex-1 overflow-y-auto" style={{ maxHeight: '320px' }}>
        <div className="space-y-0">
          {sorted.slice(0, 20).map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-tm-border/20 last:border-0">
              <div className="flex-1">
                <div className="text-xs text-tm-green font-bold">
                  {(c.charge_energy_added ?? 0).toFixed(1)} kWh
                </div>
                <div className="text-xs text-tm-text-dim">
                  {formatDate(c.date)} · {formatDuration(c.duration_min)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-tm-cyan">
                  {c.start_battery_level != null && c.end_battery_level != null
                    ? `${c.start_battery_level}% → ${c.end_battery_level}%`
                    : '---'}
                </div>
                {c.cost != null && c.cost > 0 && (
                  <div className="text-xs text-tm-yellow">¥{c.cost.toFixed(2)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChargeHistory;
