import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchDrivesData, fetchCommuteCompare, fetchDrivePositions } from '../utils/api';
import type { Drive, CommuteCompareResponse } from '../utils/api';
import SpeedCurve from '../components/SpeedCurve';
import PowerCurve from '../components/PowerCurve';
import BatteryLevel from '../components/BatteryLevel';
import TemperatureCurve from '../components/TemperatureCurve';
import { formatDuration } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * Commute comparison page: compare two drives (outbound vs return).
 */
const CommuteCompare: React.FC = () => {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [driveAId, setDriveAId] = useState<number>(0);
  const [driveBId, setDriveBId] = useState<number>(0);
  const [compareData, setCompareData] = useState<CommuteCompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [positionsA, setPositionsA] = useState<{ latitude: number; longitude: number; speed: number | null; power: number | null; battery_level: number | null; date: string }[]>([]);
  const [positionsB, setPositionsB] = useState<{ latitude: number; longitude: number; speed: number | null; power: number | null; battery_level: number | null; date: string }[]>([]);

  // Load drives list
  useEffect(() => {
    fetchDrivesData(1, 50)
      .then((res) => {
        setDrives(res.drives);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load comparison when both drives selected
  const loadCompare = useCallback(async () => {
    if (!driveAId || !driveBId) return;
    setLoading(true);
    try {
      const [compare, posA, posB] = await Promise.all([
        fetchCommuteCompare(driveAId, driveBId),
        fetchDrivePositions(driveAId),
        fetchDrivePositions(driveBId),
      ]);
      setCompareData(compare);
      setPositionsA(posA.positions);
      setPositionsB(posB.positions);
    } catch {
      setCompareData(null);
    }
    setLoading(false);
  }, [driveAId, driveBId]);

  useEffect(() => {
    if (driveAId && driveBId) {
      loadCompare();
    }
  }, [driveAId, driveBId, loadCompare]);

  const autoSelect = () => {
    if (drives.length >= 2) {
      setDriveAId(drives[0].id);
      setDriveBId(drives[1].id);
    }
  };

  const kpiA = compareData?.driveA.kpi;
  const kpiB = compareData?.driveB.kpi;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="scanline-overlay" />
      <header className="border-b border-tm-border bg-tm-panel/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg font-bold">⇄</div>
            <div>
              <h1 className="text-base font-bold text-blue-400 tracking-wider" style={{ textShadow: '0 0 8px rgba(59,130,246,0.5)' }}>
                通勤对比分析
              </h1>
              <p className="text-xs text-tm-text-dim tracking-wider">路线分析 // 去程 vs 回程</p>
            </div>
            <nav className="flex items-center gap-1.5 ml-5">
              <Link to="/" className="px-4 py-1.5 text-xs uppercase tracking-wider rounded-md border border-tm-border/30 text-tm-text-dim hover:border-tm-cyan/30 hover:text-tm-text transition-all">
                ◉ 仪表盘
              </Link>
              <Link to="/commute" className="px-4 py-1.5 text-xs uppercase tracking-wider rounded-md border border-blue-500/50 text-blue-400 bg-blue-500/10 transition-all">
                ⇄ 通勤对比
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-tm-text-dim">系统时间</span>
            <span className="text-blue-400 text-xs font-mono">{new Date().toLocaleTimeString('zh-CN', { hour12: false })}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 space-y-4">
        {/* Drive Selector */}
        <div className="panel">
          <div className="panel-header"><span className="text-blue-400">◆</span> 行程选择</div>
          <div className="panel-body">
            <div className="flex items-end gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="data-label block mb-1">去程 (行程 A)</label>
                <select
                  value={driveAId}
                  onChange={(e) => setDriveAId(parseInt(e.target.value, 10))}
                  className="w-full bg-tm-panel-light border border-tm-border text-tm-text text-xs rounded px-2 py-1.5 font-mono"
                >
                  <option value={0}>-- 选择行程 --</option>
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      #{d.id} — {d.start_geofence || d.start_address || '未知'} → {d.end_geofence || d.end_address || '未知'}
                      {' '}({(d.distance ?? 0).toFixed(0)}km, {formatDuration(d.duration_min)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="data-label block mb-1">回程 (行程 B)</label>
                <select
                  value={driveBId}
                  onChange={(e) => setDriveBId(parseInt(e.target.value, 10))}
                  className="w-full bg-tm-panel-light border border-tm-border text-tm-text text-xs rounded px-2 py-1.5 font-mono"
                >
                  <option value={0}>-- 选择行程 --</option>
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      #{d.id} — {d.start_geofence || d.start_address || '未知'} → {d.end_geofence || d.end_address || '未知'}
                      {' '}({(d.distance ?? 0).toFixed(0)}km, {formatDuration(d.duration_min)})
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={autoSelect} className="px-4 py-1.5 text-xs uppercase tracking-wider border border-blue-500/30 text-blue-400 rounded hover:bg-blue-500/10 transition-all">
                自动选择前两条
              </button>
            </div>
          </div>
        </div>

        {loading && !compareData && (
          <div className="panel">
            <div className="panel-body flex items-center justify-center h-32">
              <span className="text-tm-text-dim text-sm animate-pulse">加载行程中...</span>
            </div>
          </div>
        )}

        {drives.length === 0 && !loading && (
          <div className="panel">
            <div className="panel-body flex items-center justify-center h-32">
              <span className="text-tm-text-dim text-sm">暂无行程数据，开车后自动采集。</span>
            </div>
          </div>
        )}

        {!compareData && drives.length > 0 && !loading && (
          <div className="panel">
            <div className="panel-body flex items-center justify-center h-32">
              <span className="text-tm-text-dim text-sm">选择两条行程开始对比分析</span>
            </div>
          </div>
        )}

        {compareData && (
          <>
            {/* KPI Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard label="总时长" a={formatDuration(kpiA?.totalDuration)} b={formatDuration(kpiB?.totalDuration)} better="lower" aVal={kpiA?.totalDuration ?? 0} bVal={kpiB?.totalDuration ?? 0} />
              <KPICard label="平均速度" a={`${kpiA?.avgSpeed ?? 0} km/h`} b={`${kpiB?.avgSpeed ?? 0} km/h`} better="higher" aVal={kpiA?.avgSpeed ?? 0} bVal={kpiB?.avgSpeed ?? 0} />
              <KPICard label="最高速度" a={`${kpiA?.maxSpeed ?? 0} km/h`} b={`${kpiB?.maxSpeed ?? 0} km/h`} better="higher" aVal={kpiA?.maxSpeed ?? 0} bVal={kpiB?.maxSpeed ?? 0} />
              <KPICard label="总距离" a={`${kpiA?.totalDistance ?? 0} km`} b={`${kpiB?.totalDistance ?? 0} km`} better="lower" aVal={kpiA?.totalDistance ?? 0} bVal={kpiB?.totalDistance ?? 0} unit="km" />
              <KPICard label="消耗续航" a={`${kpiA?.rangeConsumed ?? 0} km`} b={`${kpiB?.rangeConsumed ?? 0} km`} better="lower" aVal={kpiA?.rangeConsumed ?? 0} bVal={kpiB?.rangeConsumed ?? 0} />
              <KPICard label="续航效率" a={`${kpiA?.efficiency_pct ?? 0}%`} b={`${kpiB?.efficiency_pct ?? 0}%`} better="higher" aVal={kpiA?.efficiency_pct ?? 0} bVal={kpiB?.efficiency_pct ?? 0} unit="%" />
            </section>

            {/* Segment Comparison + Waiting Analysis */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SegmentChart compareData={compareData} />
              <WaitingChart compareData={compareData} />
            </section>

            {/* Consistency Radar */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ConsistencyRadar compareData={compareData} />
              <Conclusions compareData={compareData} />
            </section>

            {/* Drive Detail Curves */}
            {positionsA.length > 1 && (
              <section>
                <div className="panel mb-4">
                  <div className="panel-header"><span className="text-blue-400">◆</span> 去程 — 行程 A #{compareData.driveA.info.id as React.ReactNode}</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SpeedCurve positions={positionsA as any} />
                  <PowerCurve positions={positionsA as any} />
                  <BatteryLevel positions={positionsA as any} />
                  <TemperatureCurve positions={positionsA as any} />
                </div>
              </section>
            )}
            {positionsB.length > 1 && (
              <section className="mt-4">
                <div className="panel mb-4">
                  <div className="panel-header"><span className="text-orange-400">◆</span> 回程 — 行程 B #{compareData.driveB.info.id as React.ReactNode}</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SpeedCurve positions={positionsB as any} />
                  <PowerCurve positions={positionsB as any} />
                  <BatteryLevel positions={positionsB as any} />
                  <TemperatureCurve positions={positionsB as any} />
                </div>
              </section>
            )}
          </>
        )}

        <footer className="border-t border-tm-border/30 pt-3 pb-4 flex items-center justify-between text-xs text-tm-text-dim">
          <span>TeslaMate 控制中心 v2.0 — 通勤分析模块</span>
          <span className="text-blue-400">数据源: PostgreSQL</span>
        </footer>
      </main>
    </div>
  );
};

/* ─── Sub-components ───────────────────────────────────────────── */

interface KPICardProps {
  label: string;
  a: string;
  b: string;
  better: 'higher' | 'lower';
  aVal: number;
  bVal: number;
  unit?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, a, b, better, aVal, bVal, unit }) => {
  const aWins = better === 'higher' ? aVal >= bVal : aVal <= bVal;
  const bWins = better === 'higher' ? bVal >= aVal : bVal <= aVal;
  const tied = Math.abs(aVal - bVal) < 0.01;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="text-tm-text-dim">◆</span> {label}
      </div>
      <div className="panel-body grid grid-cols-2 gap-4">
        <div className={`p-2 rounded ${aWins && !tied ? 'bg-blue-500/10 border border-blue-500/30' : ''}`}>
          <div className="text-xs text-tm-text-dim uppercase">A (去程)</div>
          <div className={`text-lg font-bold mt-0.5 ${aWins && !tied ? 'text-blue-400' : 'text-tm-text-dim'}`}>{a}</div>
        </div>
        <div className={`p-2 rounded ${bWins && !tied ? 'bg-orange-500/10 border border-orange-500/30' : ''}`}>
          <div className="text-xs text-tm-text-dim uppercase">B (回程)</div>
          <div className={`text-lg font-bold mt-0.5 ${bWins && !tied ? 'text-orange-400' : 'text-tm-text-dim'}`}>{b}</div>
        </div>
      </div>
    </div>
  );
};

const SegmentChart: React.FC<{ compareData: CommuteCompareResponse }> = ({ compareData }) => {
  const segsA = compareData.driveA.segments;
  const segsB = compareData.driveB.segments;
  const maxIdx = Math.max(segsA.length, segsB.length);
  const validCount = Math.min(
    segsA.filter((s): s is NonNullable<typeof s> => s !== null).length,
    segsB.filter((s): s is NonNullable<typeof s> => s !== null).length,
  );

  const labels = Array.from({ length: validCount }, (_, i) => `S${i + 1}`);
  const durationsA = segsA.slice(0, validCount).map((s) => s ? s.duration_s : 0);
  const durationsB = segsB.slice(0, validCount).map((s) => s ? s.duration_s : 0);

  if (validCount === 0) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header"><span className="text-blue-400">◆</span> 分段耗时对比</div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">暂无分段数据</span>
        </div>
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'A (去程)',
        data: durationsA,
        backgroundColor: durationsA.map((v, i) => v <= (durationsB[i] ?? 0) ? 'rgba(0,255,65,0.6)' : 'rgba(255,45,85,0.6)'),
        borderColor: durationsA.map((v, i) => v <= (durationsB[i] ?? 0) ? '#00ff41' : '#ff2d55'),
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: 'B (回程)',
        data: durationsB,
        backgroundColor: durationsB.map((v, i) => v <= (durationsA[i] ?? 0) ? 'rgba(0,255,65,0.6)' : 'rgba(255,45,85,0.6)'),
        borderColor: durationsB.map((v, i) => v <= (durationsA[i] ?? 0) ? '#00ff41' : '#ff2d55'),
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-blue-400">◆</span> 分段耗时对比
        <span className="ml-auto text-xs text-tm-text-dim">
          <span className="text-tm-green">■</span> 更快 <span className="text-tm-red">■</span> 更慢
        </span>
      </div>
      <div className="panel-body flex-1 min-h-[220px]">
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' as const, labels: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 12 }, boxWidth: 12 } },
              tooltip: { backgroundColor: '#111827', borderColor: '#1e3a5f', borderWidth: 1, titleFont: { family: 'JetBrains Mono', size: 13 }, bodyFont: { family: 'JetBrains Mono', size: 12 }, titleColor: '#e0e7ff', bodyColor: '#6b7fa3' },
            },
            scales: {
              x: { ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(30,58,95,0.3)' }, border: { color: '#1e3a5f' } },
              y: { title: { display: true, text: '耗时 (秒)', color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 12 } }, ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(30,58,95,0.15)' }, border: { color: '#1e3a5f' } },
            },
          }}
        />
      </div>
    </div>
  );
};

const WaitingChart: React.FC<{ compareData: CommuteCompareResponse }> = ({ compareData }) => {
  const waitsA = compareData.driveA.waits;
  const waitsB = compareData.driveB.waits;
  const totalA = waitsA.reduce((s, w) => s + w.duration_s, 0);
  const totalB = waitsB.reduce((s, w) => s + w.duration_s, 0);
  const maxWaitA = waitsA.length > 0 ? Math.max(...waitsA.map((w) => w.duration_s)) : 0;
  const maxWaitB = waitsB.length > 0 ? Math.max(...waitsB.map((w) => w.duration_s)) : 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header"><span className="text-orange-400">◆</span> 红绿灯/等待分析</div>
      <div className="panel-body flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-xs font-bold text-blue-400 uppercase">A (去程)</div>
            <div>
              <span className="data-label">检测到停车</span>
              <div className="text-lg font-bold text-tm-text mt-0.5">{waitsA.length}</div>
            </div>
            <div>
              <span className="data-label">总等待时间</span>
              <div className={`text-lg font-bold mt-0.5 ${totalA <= totalB ? 'text-tm-green glow-text-green' : 'text-tm-red'}`}>{formatDuration(totalA / 60)}</div>
            </div>
            <div>
              <span className="data-label">最长停顿</span>
              <div className="text-lg font-bold text-tm-orange mt-0.5">{formatDuration(maxWaitA / 60)}</div>
            </div>
            {waitsA.map((w, i) => (
              <div key={i} className="text-xs text-tm-text-dim border-t border-tm-border/20 pt-1">
                停车 #{i + 1}: {formatDuration(w.duration_s / 60)} 于 {new Date(w.start_time).toLocaleTimeString('zh-CN', { hour12: false })}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold text-orange-400 uppercase">B (回程)</div>
            <div>
              <span className="data-label">检测到停车</span>
              <div className="text-lg font-bold text-tm-text mt-0.5">{waitsB.length}</div>
            </div>
            <div>
              <span className="data-label">总等待时间</span>
              <div className={`text-lg font-bold mt-0.5 ${totalB <= totalA ? 'text-tm-green glow-text-green' : 'text-tm-red'}`}>{formatDuration(totalB / 60)}</div>
            </div>
            <div>
              <span className="data-label">最长停顿</span>
              <div className="text-lg font-bold text-tm-orange mt-0.5">{formatDuration(maxWaitB / 60)}</div>
            </div>
            {waitsB.map((w, i) => (
              <div key={i} className="text-xs text-tm-text-dim border-t border-tm-border/20 pt-1">
                停车 #{i + 1}: {formatDuration(w.duration_s / 60)} 于 {new Date(w.start_time).toLocaleTimeString('zh-CN', { hour12: false })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsistencyRadar: React.FC<{ compareData: CommuteCompareResponse }> = ({ compareData }) => {
  const validA = compareData.driveA.segments.filter((s): s is NonNullable<typeof s> => s !== null);
  const validB = compareData.driveB.segments.filter((s): s is NonNullable<typeof s> => s !== null);

  const calcStd = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length);
  };

  const speedStdA = calcStd(validA.map((s) => s.avg_speed));
  const speedStdB = calcStd(validB.map((s) => s.avg_speed));
  const powerStdA = calcStd(validA.map((s) => s.avg_power));
  const powerStdB = calcStd(validB.map((s) => s.avg_power));
  const durationStdA = calcStd(validA.map((s) => s.duration_s));
  const durationStdB = calcStd(validB.map((s) => s.duration_s));

  // Lower std = more consistent = higher score
  const maxStd = Math.max(speedStdA, speedStdB, powerStdA, powerStdB, durationStdA, durationStdB, 1);
  const norm = (v: number) => Math.max(0, 100 - (v / maxStd) * 100);

  const data = {
    labels: ['速度稳定性', '功率稳定性', '时长稳定性'],
    datasets: [
      {
        label: 'A (去程)',
        data: [norm(speedStdA), norm(powerStdA), norm(durationStdA)],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
      },
      {
        label: 'B (回程)',
        data: [norm(speedStdB), norm(powerStdB), norm(durationStdB)],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#f97316',
      },
    ],
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header"><span className="text-blue-400">◆</span> 稳定性雷达图</div>
      <div className="panel-body flex-1 min-h-[250px]">
        <Radar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                angleLines: { color: 'rgba(30,58,95,0.4)' },
                grid: { color: 'rgba(30,58,95,0.3)' },
                pointLabels: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 12 } },
                ticks: { display: false },
                suggestedMin: 0,
                suggestedMax: 100,
              },
            },
            plugins: {
              legend: { position: 'top' as const, labels: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 12 }, boxWidth: 12 } },
            },
          }}
        />
      </div>
    </div>
  );
};

const Conclusions: React.FC<{ compareData: CommuteCompareResponse }> = ({ compareData }) => {
  const kpiA = compareData.driveA.kpi;
  const kpiB = compareData.driveB.kpi;
  const segsA = compareData.driveA.segments.filter((s): s is NonNullable<typeof s> => s !== null);
  const segsB = compareData.driveB.segments.filter((s): s is NonNullable<typeof s> => s !== null);

  const conclusions: { label: string; text: string; color: string }[] = [];

  // Duration comparison
  if (kpiA.totalDuration < kpiB.totalDuration) {
    const saved = kpiB.totalDuration - kpiA.totalDuration;
    conclusions.push({ label: '更快路线', text: `A (去程) 快 ${formatDuration(saved)}`, color: 'text-tm-green glow-text-green' });
  } else if (kpiB.totalDuration < kpiA.totalDuration) {
    const saved = kpiA.totalDuration - kpiB.totalDuration;
    conclusions.push({ label: '更快路线', text: `B (回程) 快 ${formatDuration(saved)}`, color: 'text-tm-green glow-text-green' });
  } else {
    conclusions.push({ label: '路线耗时', text: '两条路线耗时相同', color: 'text-tm-text-dim' });
  }

  // Efficiency
  if (kpiA.efficiency_pct > kpiB.efficiency_pct) {
    conclusions.push({ label: '更优效率', text: `A: ${kpiA.efficiency_pct}% vs B: ${kpiB.efficiency_pct}%`, color: 'text-tm-cyan glow-text-cyan' });
  } else if (kpiB.efficiency_pct > kpiA.efficiency_pct) {
    conclusions.push({ label: '更优效率', text: `B: ${kpiB.efficiency_pct}% vs A: ${kpiA.efficiency_pct}%`, color: 'text-tm-cyan glow-text-cyan' });
  }

  // Slowest segment
  if (segsA.length > 0 || segsB.length > 0) {
    const allA = segsA.map((s) => ({ ...s, drive: 'A' }));
    const allB = segsB.map((s) => ({ ...s, drive: 'B' }));
    const slowest = [...allA, ...allB].sort((a, b) => b.duration_s - a.duration_s)[0];
    if (slowest) {
      conclusions.push({
        label: '最慢分段',
        text: `行程 ${slowest.drive}，分段 ${slowest.index + 1}: ${formatDuration(slowest.duration_s / 60)}`,
        color: 'text-tm-red',
      });
    }
    const fastest = [...allA, ...allB].sort((a, b) => a.duration_s - b.duration_s)[0];
    if (fastest) {
      conclusions.push({
        label: '最快分段',
        text: `行程 ${fastest.drive}，分段 ${fastest.index + 1}: ${formatDuration(fastest.duration_s / 60)}`,
        color: 'text-tm-green glow-text-green',
      });
    }
  }

  // Distance
  if (kpiA.totalDistance !== kpiB.totalDistance) {
    const shorter = kpiA.totalDistance < kpiB.totalDistance ? 'A' : 'B';
    const diff = Math.abs(kpiA.totalDistance - kpiB.totalDistance);
    conclusions.push({
      label: '路线距离',
      text: `路线 ${shorter} 短 ${diff.toFixed(1)} km`,
      color: 'text-tm-yellow',
    });
  }

  if (conclusions.length === 0) {
    conclusions.push({ label: '分析', text: '选择两条行程查看对比分析', color: 'text-tm-text-dim' });
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header"><span className="text-tm-yellow">◆</span> 关键结论</div>
      <div className="panel-body flex-1 space-y-3">
        {conclusions.map((c, i) => (
          <div key={i} className="flex items-start gap-3 p-2 rounded bg-tm-panel-light/50 border border-tm-border/30">
            <span className={`text-xs font-bold shrink-0 w-28 ${c.color}`}>{c.label}</span>
            <span className="text-xs text-tm-text">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommuteCompare;
