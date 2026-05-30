import React from 'react';
import { useTeslaMateData } from '../hooks/useTeslaMateData';
import Header from '../components/Header';
import VehicleStatus from '../components/VehicleStatus';
import ChargingAnalysis from '../components/ChargingAnalysis';
import ChargingStats from '../components/ChargingStats';
import DrivingHabits from '../components/DrivingHabits';
import MileageTrend from '../components/MileageTrend';
import MonthlyComparison from '../components/MonthlyComparison';
import RecentActivity from '../components/RecentActivity';
import WeeklyMileage from '../components/WeeklyMileage';
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
    car, drives, charges, weekly, summary, monthly, mileage, efficiency, locations,
    loading, error, lastUpdated, refresh, countdown,
  } = useTeslaMateData();

  const totalDrives = summary?.drives?.drive_count ? parseInt(summary.drives.drive_count, 10) : 0;
  const totalCharges = summary?.charges?.charge_count ? parseInt(summary.charges.charge_count, 10) : 0;
  const totalDistance = Number(summary?.drives?.total_distance ?? 0);
  const avgEff = Number(summary?.drives?.avg_efficiency ?? 0);

  const kpiCards = [
    { label: '总行程', value: totalDrives.toLocaleString(), sub: '次出行', color: 'text-tm-orange' },
    { label: '总充电', value: totalCharges.toLocaleString(), sub: '次', color: 'text-tm-green' },
    { label: '总里程', value: totalDistance > 0 ? `${totalDistance.toLocaleString(undefined, {maximumFractionDigits: 0})}` : '0', sub: 'km 累计行驶', color: 'text-tm-cyan' },
    { label: '平均效率', value: avgEff > 0 ? `${Number(avgEff).toFixed(1)}` : '—', sub: 'Wh/km', color: avgEff > 0 ? 'text-tm-yellow' : 'text-white/30' },
    { label: '总能量', value: summary?.charges?.total_energy && Number(summary.charges.total_energy) > 0 ? `${Number(summary.charges.total_energy).toLocaleString(undefined, {maximumFractionDigits: 0})}` : '—', sub: 'kWh', color: summary?.charges?.total_energy && Number(summary.charges.total_energy) > 0 ? 'text-tm-green' : 'text-white/30' },
    { label: '最高速度', value: summary?.drives?.max_speed && Number(summary.drives.max_speed) > 0 ? `${Number(summary.drives.max_speed)}` : '—', sub: 'km/h', color: summary?.drives?.max_speed && Number(summary.drives.max_speed) > 0 ? 'text-tm-red' : 'text-white/30' },
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
            <RecentActivity drives={drives} charges={charges} />
            <ChargingAnalysis charges={charges} />
          </div>

          {/* Row 2: KPI概览 + 本周里程 + 里程趋势 + 月度对比 */}
          <div className="grid grid-cols-4 gap-2 overflow-hidden min-h-0 flex-1">
            <div className="panel overflow-hidden flex flex-col min-h-0">
              <PanelHead icon="◆" title="KPI 概览" />
              <div className="p-2 flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-3 gap-1 items-center h-full">
                  {kpiCards.map((kpi) => (
                    <div key={kpi.label} className="text-center rounded-md bg-white/[0.02] border border-tm-border/30 py-1">
                      <div className="text-[8px] uppercase tracking-wider text-white/25 mb-0.5">{kpi.label}</div>
                      <div className={`font-mono text-xs font-semibold leading-tight ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-[8px] text-white/15 mt-0.5">{kpi.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <WeeklyMileage weekly={weekly} />
            <div className="panel overflow-hidden flex flex-col min-h-0">
              <PanelHead icon="◆" title="里程趋势" />
              <div className="p-2 flex-1 min-h-0"><MileageTrend mileage={mileage} /></div>
            </div>
            <MonthlyComparison monthly={monthly} />
          </div>

          {/* Row 3: 驾驶习惯 + 充电统计 + 常用地点 */}
          <div className="grid grid-cols-3 gap-2 overflow-hidden min-h-0 flex-1">
            <DrivingHabits drives={drives} />
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
