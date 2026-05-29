import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { MonthlyResponse } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MonthlyComparisonProps {
  monthly: MonthlyResponse | null;
}

/**
 * Monthly comparison bar chart: distance and energy for last 12 months.
 */
const MonthlyComparison: React.FC<MonthlyComparisonProps> = ({ monthly }) => {
  const driveStats = monthly?.driveStats ?? [];
  const chargeStats = monthly?.chargeStats ?? [];

  if (driveStats.length === 0) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <span className="text-tm-purple">◆</span> 月度对比
        </div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">暂无数据</span>
        </div>
      </div>
    );
  }

  // Merge drive and charge stats by month
  const chargeMap = new Map(chargeStats.map((c) => [c.month, c]));
  const labels = driveStats.map((d) => {
    const [y, m] = d.month.split('-');
    return `${parseInt(m)}/${y.slice(2)}`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: '距离 (km)',
        data: driveStats.map((d) => d.distance),
        backgroundColor: 'rgba(0, 212, 255, 0.6)',
        borderColor: '#00d4ff',
        borderWidth: 1,
        borderRadius: 3,
        yAxisID: 'y',
      },
      {
        label: '能量 (kWh)',
        data: driveStats.map((d) => {
          const c = chargeMap.get(d.month);
          return c?.energy_added ?? 0;
        }),
        backgroundColor: 'rgba(0, 255, 65, 0.5)',
        borderColor: '#00ff41',
        borderWidth: 1,
        borderRadius: 3,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
      x: { ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(30,58,95,0.3)' }, border: { color: '#1e3a5f' } },
      y: {
        position: 'left' as const,
        title: { display: true, text: 'km', color: '#00d4ff', font: { family: 'JetBrains Mono', size: 12 } },
        ticks: { color: '#00d4ff', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { color: 'rgba(30,58,95,0.15)' },
        border: { color: '#1e3a5f' },
      },
      y1: {
        position: 'right' as const,
        title: { display: true, text: 'kWh', color: '#00ff41', font: { family: 'JetBrains Mono', size: 12 } },
        ticks: { color: '#00ff41', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { drawOnChartArea: false },
        border: { color: '#1e3a5f' },
      },
    },
  };

  const totalDist = driveStats.reduce((s, d) => s + d.distance, 0);
  const totalEnergy = chargeStats.reduce((s, c) => s + c.energy_added, 0);
  const totalDrives = driveStats.reduce((s, d) => s + parseInt(d.drive_count, 10), 0);
  const totalCharges = chargeStats.reduce((s, c) => s + parseInt(c.charge_count, 10), 0);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-purple">◆</span> 月度对比
        <span className="ml-auto text-xs text-tm-text-dim">12 个月</span>
      </div>
      <div className="panel-body flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <span className="data-label">总距离</span>
            <div className="text-sm font-bold text-tm-cyan glow-text-cyan mt-0.5">{totalDist.toFixed(0)} km</div>
          </div>
          <div>
            <span className="data-label">总能量</span>
            <div className="text-sm font-bold text-tm-green glow-text-green mt-0.5">{totalEnergy.toFixed(0)} kWh</div>
          </div>
          <div>
            <span className="data-label">行程</span>
            <div className="text-sm font-bold text-tm-orange glow-text-orange mt-0.5">{totalDrives}</div>
          </div>
          <div>
            <span className="data-label">充电</span>
            <div className="text-sm font-bold text-tm-text-dim mt-0.5">{totalCharges}</div>
          </div>
        </div>
        <div className="flex-1 min-h-[220px]">
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparison;
