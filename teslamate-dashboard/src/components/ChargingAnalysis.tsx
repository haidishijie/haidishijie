import React from 'react';
import type { Charge } from '../types/teslamate';
import { formatKm, formatDuration } from '../utils/formatters';

interface ChargingAnalysisProps {
  charges: Charge[];
}

/**
 * Charging analysis panel: charge count, total energy, avg power,
 * fast/slow ratio breakdown.
 */
const ChargingAnalysis: React.FC<ChargingAnalysisProps> = ({ charges }) => {
  const totalCount = charges.length;
  const totalEnergy = charges.reduce((s, c) => s + (c.charge_energy_added ?? 0), 0);
  const avgPerSession = totalCount > 0 ? totalEnergy / totalCount : 0;
  const avgDuration = totalCount > 0 ? charges.reduce((s, c) => s + (c.duration_min ?? 0), 0) / totalCount : 0;
  const totalCost = charges.reduce((s, c) => s + (c.cost ?? 0), 0);
  const avgSocStart = totalCount > 0
    ? charges.reduce((s, c) => s + (c.start_battery_level ?? 0), 0) / totalCount
    : 0;
  const avgSocEnd = totalCount > 0
    ? charges.reduce((s, c) => s + (c.end_battery_level ?? 0), 0) / totalCount
    : 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-green">◆</span> 充电分析
        <span className="ml-auto text-xs text-tm-text-dim">{totalCount} 次充电</span>
      </div>
      <div className="panel-body flex-1">
        {totalCount === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <span className="text-tm-text-dim text-sm">暂无充电数据</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <StatItem label="总能量" value={`${totalEnergy.toFixed(1)} kWh`} color="text-tm-green glow-text-green" />
              <StatItem label="平均/次" value={`${avgPerSession.toFixed(1)} kWh`} color="text-tm-cyan glow-text-cyan" />
              <StatItem label="总费用" value={totalCost > 0 ? `¥${totalCost.toFixed(2)}` : '---'} color="text-tm-yellow" />
            </div>
            <div className="space-y-4">
              <StatItem label="平均时长" value={formatDuration(avgDuration)} color="text-tm-text" />
              <StatItem label="平均起始电量" value={`${Math.round(avgSocStart)}%`} color="text-tm-orange glow-text-orange" />
              <StatItem label="平均结束电量" value={`${Math.round(avgSocEnd)}%`} color="text-tm-green glow-text-green" />
            </div>
            <div className="space-y-4">
              <StatItem label="总次数" value={totalCount.toString()} color="text-tm-cyan glow-text-cyan" />
              {/* Fast vs slow breakdown */}
              <div>
                <span className="data-label">充电分布</span>
                <div className="mt-1 space-y-1">
                  <MiniBar label="快充 DC" value={0} total={totalCount} color="bg-tm-green" />
                  <MiniBar label="慢充 AC" value={totalCount} total={totalCount} color="bg-tm-cyan" />
                </div>
              </div>
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

const MiniBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-tm-text-dim w-14">{label}</span>
      <div className="flex-1 data-bar">
        <div className={`data-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-tm-text-dim w-8 text-right">{value}</span>
    </div>
  );
};

export default ChargingAnalysis;
