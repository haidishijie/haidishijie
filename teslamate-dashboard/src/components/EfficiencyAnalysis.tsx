import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { EfficiencyResponse } from '../utils/api';
import { formatTemp } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface EfficiencyAnalysisProps {
  efficiency: EfficiencyResponse | null;
}

/**
 * Efficiency analysis panel: Wh/km trend with temperature correlation
 */
const EfficiencyAnalysis: React.FC<EfficiencyAnalysisProps> = ({ efficiency }) => {
  const points = efficiency?.efficiency ?? [];

  if (points.length === 0) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-tm-border/40">
          <span className="text-[10px] text-tm-yellow/60">◆</span>
          <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-white/35">能耗效率</h3>
        </div>
        <div className="flex items-center justify-center flex-1">
          <span className="text-white/15 text-xs">分析数据不足</span>
        </div>
      </div>
    );
  }

  const sorted = [...points].reverse();
  const labels = sorted.map((p) => {
    const d = new Date(p.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const whPerKm = sorted.map((p) => p.wh_per_km ?? 0);
  const temps = sorted.map((p) => p.outside_temp_avg ?? 0);
  const effPct = sorted.map((p) => p.efficiency_pct ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: '消耗比',
        data: whPerKm,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#00d4ff',
        fill: true,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: '效率 %',
        data: effPct,
        borderColor: '#00ff41',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 3,
        pointBackgroundColor: '#00ff41',
        borderDash: [4, 4],
        fill: false,
        tension: 0.3,
        yAxisID: 'y1',
      },
      {
        label: '温度 (°C)',
        data: temps,
        borderColor: '#ff6b35',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 2,
        pointBackgroundColor: '#ff6b35',
        fill: false,
        tension: 0.3,
        yAxisID: 'y2',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 10 }, boxWidth: 8, padding: 8 },
      },
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#1e3a5f',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 10 },
        titleColor: '#e0e7ff',
        bodyColor: '#6b7fa3',
      },
    },
    scales: {
      x: { ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 9 }, maxRotation: 30 }, grid: { color: 'rgba(30,58,95,0.3)' }, border: { color: '#1e3a5f' } },
      y: {
        position: 'left' as const,
        title: { display: true, text: '消耗比', color: '#00d4ff', font: { family: 'JetBrains Mono', size: 10 } },
        ticks: { color: '#00d4ff', font: { family: 'JetBrains Mono', size: 9 } },
        grid: { color: 'rgba(30,58,95,0.15)' },
        border: { color: '#1e3a5f' },
      },
      y1: {
        position: 'right' as const,
        title: { display: true, text: 'Eff %', color: '#00ff41', font: { family: 'JetBrains Mono', size: 10 } },
        ticks: { color: '#00ff41', font: { family: 'JetBrains Mono', size: 9 }, callback: (v: string | number) => `${v}%` },
        grid: { drawOnChartArea: false },
        border: { color: '#1e3a5f' },
      },
      y2: { display: false },
    },
  };

  const avgWh = efficiency?.avgWhPerKm;
  const validWh = whPerKm.filter((v) => v > 0);
  const best = validWh.length > 0 ? Math.min(...validWh) : 0;
  const worst = validWh.length > 0 ? Math.max(...validWh) : 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-tm-border/40 shrink-0">
        <span className="text-[10px] text-tm-yellow/60">◆</span>
        <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-white/35">能耗效率</h3>
      </div>
      <div className="flex-1 flex flex-col gap-1 overflow-hidden p-2">
        <div className="grid grid-cols-4 gap-1 text-center">
          <div>
            <span className="text-[9px] text-white/25 uppercase tracking-wider">平均消耗</span>
            <div className="text-xs font-bold text-tm-cyan mt-0.5">{avgWh != null ? `${avgWh}` : '---'}</div>
          </div>
          <div>
            <span className="text-[9px] text-white/25 uppercase tracking-wider">最佳</span>
            <div className="text-xs font-bold text-tm-green mt-0.5">{best > 0 ? `${best}` : '---'}</div>
          </div>
          <div>
            <span className="text-[9px] text-white/25 uppercase tracking-wider">最差</span>
            <div className="text-xs font-bold text-tm-red mt-0.5">{worst > 0 ? `${worst}` : '---'}</div>
          </div>
          <div>
            <span className="text-[9px] text-white/25 uppercase tracking-wider">数据</span>
            <div className="text-xs font-bold text-white/30 mt-0.5">{points.length}</div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default EfficiencyAnalysis;
