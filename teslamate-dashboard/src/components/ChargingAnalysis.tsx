import React, { useState } from 'react';
import type { Charge } from '../types/teslamate';
import { formatDate, formatDuration } from '../utils/formatters';

interface ChargingAnalysisProps {
  charges: Charge[];
}

const StatItem: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div>
    <span className="data-label">{label}</span>
    <div className={`text-lg font-bold mt-0.5 ${color}`}>{value}</div>
  </div>
);

/**
 * Charging analysis panel with expandable charge list.
 */
const ChargingAnalysis: React.FC<ChargingAnalysisProps> = ({ charges }) => {
  const [expanded, setExpanded] = useState(false);
  // Only count charges with valid data (ignore incomplete records)
  const validCharges = charges.filter(c => c.charge_energy_added != null && c.charge_energy_added > 0);
  const totalCount = validCharges.length;
  const totalEnergy = validCharges.reduce((s, c) => s + (c.charge_energy_added ?? 0), 0);
  const avgPerSession = totalCount > 0 ? totalEnergy / totalCount : 0;
  const avgDuration = totalCount > 0 ? validCharges.reduce((s, c) => s + (c.duration_min ?? 0), 0) / totalCount : 0;
  const totalCost = validCharges.reduce((s, c) => {
    const energy = c.charge_energy_added ?? 0;
    const rate = c.is_dc ? 1.3 : 0.35;
    return s + energy * rate;
  }, 0);
  const avgSocStart = totalCount > 0 ? validCharges.reduce((s, c) => s + (c.start_battery_level ?? 0), 0) / totalCount : 0;
  const avgSocEnd = totalCount > 0 ? validCharges.reduce((s, c) => s + (c.end_battery_level ?? 0), 0) / totalCount : 0;
  const dcCount = validCharges.filter(c => c.is_dc).length;
  const acCount = totalCount - dcCount;
  const chargesSorted = [...charges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="panel flex flex-col">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-tm-border/40 min-h-[36px]">
        <span className="text-[10px] text-tm-green/60">◆</span>
        <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-white/35">充电分析</h3>
        <span className="ml-auto text-[10px] text-white/20 font-mono">{totalCount} 次充电</span>
        {totalCount > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-tm-cyan/50 hover:text-tm-cyan ml-1">
            {expanded ? '收起' : '查看'}
          </button>
        )}
      </div>
      <div className="p-4">
        {totalCount === 0 ? (
          <div className="text-center py-6 text-white/15 text-xs">暂无充电数据</div>
        ) : !expanded ? (
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <StatItem label="总能量" value={`${totalEnergy.toFixed(1)} kWh`} color="text-tm-green" />
              <StatItem label="平均/次" value={`${avgPerSession.toFixed(1)} kWh`} color="text-tm-cyan" />
              <StatItem label="总费用" value={totalCost > 0 ? `¥${totalCost.toFixed(2)}` : '---'} color="text-tm-yellow" />
            </div>
            <div className="space-y-4">
              <StatItem label="平均时长" value={formatDuration(avgDuration)} color="text-tm-text" />
              <StatItem label="平均起始" value={`${Math.round(avgSocStart)}%`} color="text-tm-orange" />
              <StatItem label="平均结束" value={`${Math.round(avgSocEnd)}%`} color="text-tm-green" />
            </div>
            <div className="space-y-4">
              <StatItem label="总次数" value={totalCount.toString()} color="text-tm-cyan" />
              <div>
                <span className="data-label">充电分布</span>
                <div className="mt-2 space-y-1.5">
                  <MiniBar label="快充 DC" value={dcCount} total={totalCount} color="bg-tm-green" />
                  <MiniBar label="慢充 AC" value={acCount} total={totalCount} color="bg-tm-cyan" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {chargesSorted.map((c) => (
              <div key={c.id} className="py-2 px-2 rounded border border-tm-border/20 hover:border-tm-cyan/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-tm-green text-[10px]">⚡</span>
                  <span className="text-sm text-tm-text">
                    {c.start_battery_level != null ? `${c.start_battery_level}%` : '--'}
                    <span className="text-white/20 mx-1">→</span>
                    {c.end_battery_level != null ? `${c.end_battery_level}%` : '--'}
                  </span>
                  <span className="ml-auto text-xs text-white/30">{formatDate(c.date)}</span>
                </div>
                <div className="flex gap-4 mt-1 ml-4">
                  <span className="text-xs text-tm-green">{c.charge_energy_added?.toFixed(1)} kWh</span>
                  <span className="text-xs text-white/30">{formatDuration(c.duration_min)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MiniBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-white/30 w-14">{label}</span>
      <div className="flex-1 data-bar">
        <div className={`data-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-white/30 w-8 text-right">{value}</span>
    </div>
  );
};

export default ChargingAnalysis;
