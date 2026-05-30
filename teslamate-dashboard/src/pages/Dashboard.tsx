import React from 'react';
import { useTeslaMateData } from '../hooks/useTeslaMateData';
import Header from '../components/Header';
import VehicleStatus from '../components/VehicleStatus';
import ChargingAnalysis from '../components/ChargingAnalysis';
import ChargingStats from '../components/ChargingStats';
import DrivingHabits from '../components/DrivingHabits';
import MileageTrend from '../components/MileageTrend';
import MonthlyComparison from '../components/MonthlyComparison';
import EfficiencyAnalysis from '../components/EfficiencyAnalysis';
import FrequentLocations from '../components/FrequentLocations';

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`panel ${className}`}>
      {children}
    </div>
  );
}

function PanelHead({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-tm-border/40 min-h-[36px]">
      <span className="text-[10px] text-tm-cyan/60">{icon}</span>
      <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-white/35">{title}</h3>
      {badge && <span className="ml-auto text-[10px] text-white/20 font-mono">{badge}</span>}
    </div>
  );
}

/**
 * Main dashboard page with section-based layout (UI redesign v2).
 */
const Dashboard: React.FC = () => {
  const {
    car, drives, charges, summary, monthly, mileage, efficiency, locations,
    loading, error, lastUpdated, refresh, countdown,
  } = useTeslaMateData();

  const totalDrives = summary?.drives?.drive_count ? parseInt(summary.drives.drive_count, 10) : 0;
  const totalCharges = summary?.charges?.charge_count ? parseInt(summary.charges.charge_count, 10) : 0;
  const totalDistance = Number(summary?.drives?.total_distance ?? 0);
  const avgEff = Number(summary?.drives?.avg_efficiency ?? 0);
  const totalEnergy = summary?.charges?.total_energy ? Number(summary.charges.total_energy) : 0;
  const maxSpeed = summary?.drives?.max_speed ? Number(summary.drives.max_speed) : 0;
  const totalActivity = totalDrives + totalCharges;

  const kpiCards = [
    { label: '总行程', value: totalDrives.toLocaleString(), sub: '次出行', color: 'text-tm-orange', barColor: 'bg-[#f97316]', barPct: totalActivity > 0 ? (totalDrives / totalActivity * 100) : 0 },
    { label: '总充电', value: totalCharges.toLocaleString(), sub: '次', color: 'text-tm-green', barColor: 'bg-[#22c55e]', barPct: totalActivity > 0 ? (totalCharges / totalActivity * 100) : 0 },
    { label: '总里程', value: totalDistance > 0 ? `${totalDistance.toLocaleString(undefined, {maximumFractionDigits: 0})}` : '0', sub: 'km 累计行驶', color: 'text-tm-cyan', barColor: 'bg-[#06b6d4]', barPct: totalDistance > 0 ? Math.min(totalDistance / 300000 * 100, 100) : 0 },
    { label: '平均效率', value: avgEff > 0 ? `${Number(avgEff).toFixed(1)}` : '—', sub: '消耗比 %', color: avgEff > 0 ? 'text-[#facc15]' : 'text-white/30', barColor: avgEff > 0 ? 'bg-[#facc15]' : 'bg-white/10', barPct: avgEff > 0 ? Math.min(avgEff, 100) : 0 },
    { label: '总能量', value: totalEnergy > 0 ? `${totalEnergy.toLocaleString(undefined, {maximumFractionDigits: 0})}` : '—', sub: 'kWh', color: totalEnergy > 0 ? 'text-tm-green' : 'text-white/30', barColor: 'bg-[#22c55e]', barPct: totalEnergy > 0 ? Math.min(totalEnergy / 30000 * 100, 100) : 0 },
    { label: '最高速度', value: maxSpeed > 0 ? `${maxSpeed}` : '—', sub: 'km/h', color: maxSpeed > 0 ? 'text-tm-red' : 'text-white/30', barColor: 'bg-[#ef4444]', barPct: maxSpeed > 0 ? Math.min(maxSpeed / 250 * 100, 100) : 0 },
  ];

  // Proportional scaling based on viewport width (reference: 1920px)
  return (
    <div className="h-screen flex flex-col bg-tm-bg">
      <div className="scanline-overlay" />

      <Header
        carName={car?.display_name ?? car?.name ?? '等待车辆连接'}
        lastUpdated={lastUpdated}
        countdown={countdown}
        status={car?.battery_level != null ? 'online' : null}
        isLoading={loading}
        hasError={error != null}
        onRefresh={refresh}
      />

      <main className="flex-1 w-full overflow-hidden px-4 pb-3 relative z-10 flex flex-col">
        {/* Error banner */}
        {error && (
          <div className="px-3 py-2 mb-2 flex items-center gap-3 border border-tm-red/50 bg-tm-red/5 rounded text-xs text-tm-red">
            <span className="status-dot status-offline" />
            <span className="font-bold">连接错误:</span> {error}
          </div>
        )}

        {/* Landscape A4: modules arranged in 3 rows, ~4 per row */}
        <div className="flex flex-col gap-2 h-full">
          {/* Row 1: 车辆状态 + 能耗效率 + 最近活动 + 充电分析 */}
          <div className="grid grid-cols-4 gap-2 overflow-hidden min-h-0 flex-1">
            <div className="panel overflow-hidden flex flex-col min-h-0">
              <PanelHead icon="◆" title="车辆状态" />
              <div className="p-2 flex-1 overflow-y-auto min-h-0"><VehicleStatus car={car} /></div>
            </div>
            <EfficiencyAnalysis efficiency={efficiency} />
            <DrivingHabits drives={drives} />
            <ChargingAnalysis charges={charges} />
          </div>

          {/* Row 2: KPI概览(半宽) + 里程趋势&月度对比(半宽堆叠) */}
          <div className="grid grid-cols-4 gap-2 overflow-hidden min-h-0 flex-1">
            <div className="col-span-2 panel overflow-hidden flex flex-col min-h-0">
              <PanelHead icon="◆" title="KPI 概览" />
              <div className="p-3 flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-3 gap-2 items-center justify-items-stretch h-full">
                  {kpiCards.map((kpi) => (
                    <div key={kpi.label} className="flex flex-col justify-center rounded-lg bg-white/[0.02] border border-tm-border/30 px-3 py-3">
                      <div className="text-[9px] uppercase font-semibold tracking-wider text-white/30">{kpi.label}</div>
                      <div className={`font-mono text-lg font-bold leading-tight mt-1 ${kpi.color}`}>{kpi.value}</div>
                      {/* Proportion bar */}
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${kpi.barColor}`} style={{ width: `${Math.min(kpi.barPct, 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] text-white/15">{kpi.sub}</span>
                        <span className="text-[8px] font-mono text-white/25">{kpi.barPct.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-2 flex flex-col gap-2 overflow-hidden min-h-0">
              <div className="panel overflow-hidden flex flex-col flex-1 min-h-0">
                <PanelHead icon="◆" title="里程趋势" />
                <div className="p-2 flex-1 min-h-0"><MileageTrend mileage={mileage} /></div>
              </div>
              <MonthlyComparison monthly={monthly} />
            </div>
          </div>

          {/* Row 3: 充电统计 + 常用地点 */}
          <div className="grid grid-cols-2 gap-2 overflow-hidden min-h-0 flex-1">
            <ChargingStats charges={charges} />
            <FrequentLocations locations={locations} />
          </div>
        </div>

        {/* Footer inline */}
        <div className="flex items-center justify-between pt-2 text-[10px] text-white/15">
          <span>TeslaMate 控制中心 v2.0 | 横版全览</span>
          <span>刷新间隔: 30s | <span className="text-tm-green">●</span> 系统正常</span>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
