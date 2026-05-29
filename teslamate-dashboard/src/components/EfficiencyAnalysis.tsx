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
        <div className="panel-header">
          <span className="text-tm-yellow">◆</span> 能耗效率
        </div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">分析数据不足</span>
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
        label: 'Wh/km',
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
        labels: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 12 }, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#1e3a5f',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono', size: 13 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        titleColor: '#e0e7ff',
        bodyColor: '#6b7fa3',
      },
    },
    scales: {
      x: { ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 11 }, maxRotation: 45 }, grid: { color: 'rgba(30,58,95,0.3)' }, border: { color: '#1e3a5f' } },
      y: {
        position: 'left' as const,
        title: { display: true, text: 'Wh/km', color: '#00d4ff', font: { family: 'JetBrains Mono', size: 12 } },
        ticks: { color: '#00d4ff', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { color: 'rgba(30,58,95,0.15)' },
        border: { color: '#1e3a5f' },
      },
      y1: {
        position: 'right' as const,
        title: { display: true, text: 'Eff %', color: '#00ff41', font: { family: 'JetBrains Mono', size: 12 } },
        ticks: { color: '#00ff41', font: { family: 'JetBrains Mono', size: 11 }, callback: (v: string | number) => `${v}%` },
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
      <div className="panel-header">
        <span className="text-tm-yellow">◆</span> 能耗效率
      </div>
      <div className="panel-body flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <span className="data-label">平均能耗</span>
            <div className="text-sm font-bold text-tm-cyan glow-text-cyan mt-0.5">{avgWh != null ? `${avgWh}` : '---'}</div>
          </div>
          <div>
            <span className="data-label">最佳</span>
            <div className="text-sm font-bold text-tm-green glow-text-green mt-0.5">{best > 0 ? `${best} Wh/km` : '---'}</div>
          </div>
          <div>
            <span className="data-label">最差</span>
            <div className="text-sm font-bold text-tm-red mt-0.5">{worst > 0 ? `${worst} Wh/km` : '---'}</div>
          </div>
          <div>
            <span className="data-label">数据点</span>
            <div className="text-sm font-bold text-tm-text-dim mt-0.5">{points.length}</div>
          </div>
        </div>
        <div className="flex-1 min-h-[200px]">
          <Line data={data} options={options} />
        </div>
        <div className="text-xs text-tm-text-dim border-t border-tm-border/50 pt-2">
          Wh/km = 每公里消耗的额定续航里程。数值越低越好。参考值: Model 3 约 150 Wh/km。
        </div>
      </div>
    </div>
  );
};

export default EfficiencyAnalysis;
