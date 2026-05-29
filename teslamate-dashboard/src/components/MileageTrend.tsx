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
import type { MileageResponse } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface MileageTrendProps {
  mileage: MileageResponse | null;
}

/**
 * Mileage trend line chart by day/week/month.
 */
const MileageTrend: React.FC<MileageTrendProps> = ({ mileage }) => {
  const data = mileage?.mileage ?? [];

  if (data.length === 0) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <span className="text-tm-cyan">◆</span> 里程趋势
        </div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">暂无数据</span>
        </div>
      </div>
    );
  }

  const labels = data.map((d) => {
    const parts = d.period.split('-');
    if (parts.length === 3) return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    return d.period;
  });
  const distances = data.map((d) => d.distance);

  const totalKm = distances.reduce((s, v) => s + v, 0);
  const avgKm = data.length > 0 ? totalKm / data.length : 0;

  const chartData = {
    labels,
    datasets: [
      {
        label: '距离 (km)',
        data: distances,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#00d4ff',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
      y: { title: { display: true, text: 'km', color: '#00d4ff', font: { family: 'JetBrains Mono', size: 12 } }, ticks: { color: '#00d4ff', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(30,58,95,0.15)' }, border: { color: '#1e3a5f' } },
    },
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-cyan">◆</span> 里程趋势
        <span className="ml-auto text-xs text-tm-text-dim">{mileage?.groupBy ?? 'day'}</span>
      </div>
      <div className="panel-body flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="data-label">总计</span>
            <div className="text-sm font-bold text-tm-cyan glow-text-cyan mt-0.5">{totalKm.toFixed(0)} km</div>
          </div>
          <div>
            <span className="data-label">日均</span>
            <div className="text-sm font-bold text-tm-green glow-text-green mt-0.5">{avgKm.toFixed(1)} km</div>
          </div>
          <div>
            <span className="data-label">数据点</span>
            <div className="text-sm font-bold text-tm-text-dim mt-0.5">{data.length}</div>
          </div>
        </div>
        <div className="flex-1 min-h-[200px]">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default MileageTrend;
