import React, { useState, useCallback } from 'react';
import { ResponsiveGridLayout } from 'react-grid-layout';
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
import 'react-grid-layout/css/styles.css';

const LAYOUT_KEY = 'teslamate-dashboard-layout-v1';
const LOCK_KEY = 'teslamate-dashboard-locked-v1';

// Default layout: 12-column grid, each module has a key and position
const DEFAULT_ITEMS = [
  { i: 'vehicle-status', label: '车辆状态', minW: 6, minH: 4, w: 12, h: 5 },
  { i: 'kpi-summary', label: 'KPI 概览', minW: 6, minH: 2, w: 12, h: 2 },
  { i: 'weekly-mileage', label: '本周里程', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'recent-activity', label: '最近活动', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'mileage-trend', label: '里程趋势', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'monthly-comparison', label: '月度对比', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'efficiency', label: '能耗效率', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'driving-habits', label: '驾驶习惯', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'charging-analysis', label: '充电分析', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'charging-stats', label: '充电统计', minW: 4, minH: 3, w: 6, h: 4 },
  { i: 'frequent-locations', label: '常用地点', minW: 4, minH: 3, w: 12, h: 4 },
];

function loadLayout(): any[] {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new modules get positions
      const defaultById = Object.fromEntries(DEFAULT_ITEMS.map((d) => [d.i, d]));
      return parsed.map((l: any) => ({
        ...defaultById[l.i],
        ...l,
      }));
    }
  } catch { /* ignore */ }
  // Generate default layout: stack items vertically
  let y = 0;
  return DEFAULT_ITEMS.map((item) => {
    const layout = { x: 0, y, w: item.w, h: item.h, minW: item.minW, minH: item.minH, i: item.i };
    y += item.h;
    return layout;
  });
}

/**
 * Main dashboard page with draggable, reorderable modules.
 */
const Dashboard: React.FC = () => {
  const {
    car, drives, charges, weekly, summary, monthly, mileage, efficiency, locations,
    loading, error, lastUpdated, refresh, countdown,
  } = useTeslaMateData();

  const [layout, setLayout] = useState<any[]>(loadLayout);
  const [locked, setLocked] = useState(() => {
    try { return localStorage.getItem(LOCK_KEY) === 'true'; }
    catch { return false; }
  });

  const toggleLock = useCallback(() => {
    setLocked(prev => {
      const next = !prev;
      localStorage.setItem(LOCK_KEY, next ? 'true' : 'false');
      return next;
    });
  }, []);

  const onLayoutChange = useCallback((newLayout: any[]) => {
    setLayout([...newLayout]);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(newLayout));
  }, []);

  const resetLayout = useCallback(() => {
    localStorage.removeItem(LAYOUT_KEY);
    const fresh = loadLayout();
    setLayout(fresh);
  }, []);

  const totalDrives = summary?.drives?.drive_count ? parseInt(summary.drives.drive_count, 10) : 0;
  const totalCharges = summary?.charges?.charge_count ? parseInt(summary.charges.charge_count, 10) : 0;
  const totalDistance = Number(summary?.drives?.total_distance ?? 0);
  const avgEff = Number(summary?.drives?.avg_efficiency ?? 0);

  const modules: Record<string, React.ReactNode> = {
    'vehicle-status': <VehicleStatus car={car} />,
    'kpi-summary': (
      <div className="panel h-full">
        <div className="panel-header"><span className="text-tm-text-dim">◆</span> KPI 概览</div>
        <div className="panel-body grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="px-2 py-1">
            <span className="data-label">总行程</span>
            <div className="text-lg font-bold text-tm-orange glow-text-orange mt-0.5">{totalDrives}</div>
          </div>
          <div className="px-2 py-1">
            <span className="data-label">总充电</span>
            <div className="text-lg font-bold text-tm-green glow-text-green mt-0.5">{totalCharges}</div>
          </div>
          <div className="px-2 py-1">
            <span className="data-label">总里程</span>
            <div className="text-lg font-bold text-tm-cyan glow-text-cyan mt-0.5">{totalDistance.toFixed(0)} km</div>
          </div>
          <div className="px-2 py-1">
            <span className="data-label">平均效率</span>
            <div className="text-lg font-bold text-tm-yellow mt-0.5">{avgEff > 0 ? `${avgEff}%` : '---'}</div>
          </div>
          <div className="px-2 py-1">
            <span className="data-label">总能量</span>
            <div className="text-lg font-bold text-tm-green glow-text-green mt-0.5">
              {summary?.charges?.total_energy && Number(summary.charges.total_energy) > 0 ? `${Number(summary.charges.total_energy).toFixed(0)} kWh` : '---'}
            </div>
          </div>
          <div className="px-2 py-1">
            <span className="data-label">最高速度</span>
            <div className="text-lg font-bold text-tm-red mt-0.5">
              {summary?.drives?.max_speed && Number(summary.drives.max_speed) > 0 ? `${summary.drives.max_speed} km/h` : '---'}
            </div>
          </div>
        </div>
      </div>
    ),
    'weekly-mileage': <WeeklyMileage weekly={weekly} />,
    'recent-activity': <RecentActivity drives={drives} charges={charges} />,
    'mileage-trend': <MileageTrend mileage={mileage} />,
    'monthly-comparison': <MonthlyComparison monthly={monthly} />,
    'efficiency': <EfficiencyAnalysis efficiency={efficiency} />,
    'driving-habits': <DrivingHabits drives={drives} />,
    'charging-analysis': <ChargingAnalysis charges={charges} />,
    'charging-stats': <ChargingStats charges={charges} />,
    'frequent-locations': <FrequentLocations locations={locations} />,
  };

  return (
    <div className="min-h-screen flex flex-col">
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

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4">
        {/* Error banner */}
        {error && (
          <div className="panel border-tm-red/50 bg-tm-red/5 mb-4">
            <div className="px-4 py-3 flex items-center gap-3">
              <span className="status-dot status-offline" />
              <div>
                <span className="text-xs text-tm-red font-bold">连接错误</span>
                <p className="text-xs text-tm-text-dim mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLock}
              className={`px-3 py-1.5 text-xs rounded-md border transition-all flex items-center gap-1.5 ${
                locked
                  ? 'border-tm-green/50 text-tm-green bg-tm-green/10 hover:bg-tm-green/20'
                  : 'border-tm-orange/50 text-tm-orange bg-tm-orange/10 hover:bg-tm-orange/20'
              }`}
            >
              {locked ? '🔒 已锁定' : '🔓 已解锁'}
            </button>
            {!locked && (
              <span className="text-xs text-tm-text-dim">拖拽模块顶部把手可调整位置</span>
            )}
            {locked && (
              <span className="text-xs text-tm-green/70">布局已固定，不会被误拖动</span>
            )}
          </div>
          <button
            onClick={resetLayout}
            className="px-3 py-1.5 text-xs border border-tm-border/50 text-tm-text-dim rounded-md hover:border-tm-orange/50 hover:text-tm-orange transition-all"
          >
            ↺ 重置布局
          </button>
        </div>

        {/* Draggable grid */}
        <ResponsiveGridLayout
          key={locked ? 'locked' : 'unlocked'}
          className="layout"
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4 }}
          rowHeight={100}
          width={1200}
          autoSize={true}
          layouts={{ lg: layout, md: layout, sm: layout, xs: layout }}
          onLayoutChange={(layout: any) => {
            if (locked) return;
            const arr = Array.isArray(layout) ? layout : [];
            setLayout(arr);
            localStorage.setItem(LAYOUT_KEY, JSON.stringify(arr));
          }}
          dragConfig={locked ? { enabled: false } : { handle: '.drag-handle' }}
          resizeConfig={{ enabled: false }}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {layout.map((item: any) => (
            <div key={item.i} className="relative overflow-visible">
              {/* Drag handle bar - hidden when locked */}
              {!locked && (
                <div className="drag-handle absolute -top-1 left-0 right-0 h-7 z-20 cursor-grab active:cursor-grabbing flex items-center px-1 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-tm-panel/80 border border-tm-cyan/30 backdrop-blur-sm">
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-tm-cyan/60" />
                      <span className="w-1 h-1 rounded-full bg-tm-cyan/40" />
                      <span className="w-1 h-1 rounded-full bg-tm-cyan/20" />
                    </div>
                    <span className="text-[9px] text-tm-cyan/60 font-mono">{DEFAULT_ITEMS.find(d => d.i === item.i)?.label || item.i}</span>
                  </div>
                </div>
              )}
              {modules[item.i]}
            </div>
          ))}
        </ResponsiveGridLayout>

        {/* Footer */}
        <footer className="border-t border-tm-border/30 pt-3 pb-4 mt-4 flex items-center justify-between text-xs text-tm-text-dim">
          <div className="flex items-center gap-4">
            <span>TeslaMate 控制中心 v2.0</span>
            <span className="text-tm-border">|</span>
            <span>{locked ? '布局已锁定' : '可拖动布局'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>刷新间隔: 30s</span>
            <span className="text-tm-border">|</span>
            <span className="text-tm-green">系统正常</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
