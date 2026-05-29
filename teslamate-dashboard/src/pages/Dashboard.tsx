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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <h2 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-white/20">{label}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-tm-border to-transparent" />
    </div>
  );
}

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

  return (
    <div className="min-h-screen flex flex-col bg-tm-bg">
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

      <main className="flex-1 w-full px-4 pb-8 relative z-10">
        {/* Error banner */}
        {error && (
          <Panel className="border-tm-red/50 bg-tm-red/5 mb-5">
            <div className="px-4 py-3 flex items-center gap-3">
              <span className="status-dot status-offline" />
              <div>
                <span className="text-xs text-tm-red font-bold">连接错误</span>
                <p className="text-xs text-tm-text-dim mt-0.5">{error}</p>
              </div>
            </div>
          </Panel>
        )}

        {/* Full-width horizontal sections */}
        <div className="flex gap-5 overflow-x-auto pb-4 min-h-[600px]">
          {/* 概览 */}
          <div className="flex flex-col gap-4 shrink-0" style={{ minWidth: '22vw', maxWidth: '24vw' }}>
            <SectionHeader label="概览" />
            <div className="panel">
              <PanelHead icon="◆" title="车辆状态" />
              <div className="p-4"><VehicleStatus car={car} /></div>
            </div>
            <div className="panel">
              <PanelHead icon="◆" title="KPI 概览" />
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {kpiCards.map((kpi) => (
                    <div key={kpi.label} className="text-center px-1 py-2.5 rounded-md bg-white/[0.02] border border-tm-border/30">
                      <div className="text-[9px] uppercase tracking-[0.06em] text-white/25 mb-1">{kpi.label}</div>
                      <div className={`font-mono text-lg font-semibold leading-tight ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-[9px] text-white/15 mt-0.5">{kpi.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <WeeklyMileage weekly={weekly} />
          </div>

          {/* 动态 */}
          <div className="flex flex-col gap-4 shrink-0" style={{ minWidth: '28vw', maxWidth: '30vw' }}>
            <SectionHeader label="动态" />
            <div className="flex-1"><RecentActivity drives={drives} charges={charges} /></div>
            <div className="panel">
              <PanelHead icon="◆" title="里程趋势" />
              <div className="p-4"><MileageTrend mileage={mileage} /></div>
            </div>
          </div>

          {/* 分析 */}
          <div className="flex flex-col gap-4 shrink-0" style={{ minWidth: '22vw', maxWidth: '24vw' }}>
            <SectionHeader label="分析" />
            <MonthlyComparison monthly={monthly} />
            <EfficiencyAnalysis efficiency={efficiency} />
          </div>

          {/* 数据透视 */}
          <div className="flex flex-col gap-4 shrink-0" style={{ minWidth: '22vw', maxWidth: '24vw' }}>
            <SectionHeader label="数据透视" />
            <DrivingHabits drives={drives} />
            <ChargingAnalysis charges={charges} />
            <ChargingStats charges={charges} />
            <FrequentLocations locations={locations} />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between pt-4 mt-4 border-t border-tm-border/40 text-[11px] text-white/15">
          <div className="flex items-center gap-3">
            <span>TeslaMate 控制中心 v2.0</span>
            <span className="opacity-30">|</span>
            <span>横版布局</span>
          </div>
          <div className="flex items-center gap-3">
            <span>刷新间隔: 30s</span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-tm-green inline-block shadow-[0_0_4px_rgba(0,255,65,0.3)]" />
              系统正常
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
