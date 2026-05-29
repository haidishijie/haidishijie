import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import type { Position } from '../types/teslamate';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface PowerCurveProps {
  positions: Position[];
}

/**
 * Power-time curve for a selected drive. Positive = driving, negative = regen.
 */
const PowerCurve: React.FC<PowerCurveProps> = ({ positions }) => {
  if (positions.length < 2) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header"><span className="text-tm-green">◆</span> 功率曲线</div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">数据不足</span>
        </div>
      </div>
    );
  }

  const labels = positions.map((p) => {
    const d = new Date(p.date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const powers = positions.map((p) => p.power ?? 0);

  const data = {
    labels,
    datasets: [{
      label: '功率 (kW)',
      data: powers,
      borderColor: '#00ff41',
      backgroundColor: 'rgba(0,255,65,0.1)',
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#111827', borderColor: '#1e3a5f', borderWidth: 1, titleFont: { family: 'JetBrains Mono', size: 13 }, bodyFont: { family: 'JetBrains Mono', size: 12 }, titleColor: '#e0e7ff', bodyColor: '#6b7fa3' },
    },
    scales: {
      x: { ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 8 }, maxTicksLimit: 15 }, grid: { color: 'rgba(30,58,95,0.3)' }, border: { color: '#1e3a5f' } },
      y: {
        title: { display: true, text: 'kW', color: '#00ff41', font: { family: 'JetBrains Mono', size: 12 } },
        ticks: { color: '#00ff41', font: { family: 'JetBrains Mono', size: 11 }, callback: (v: string | number) => `${Number(v) > 0 ? '+' : ''}${v}` },
        grid: { color: 'rgba(30,58,95,0.15)' },
        border: { color: '#1e3a5f' },
      },
    },
  };

  const maxP = Math.max(...powers);
  const minP = Math.min(...powers);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-green">◆</span> 功率曲线
        <span className="ml-auto text-xs text-tm-text-dim">
          <span className="text-tm-orange">{minP} kW</span> / <span className="text-tm-green">+{maxP} kW</span>
        </span>
      </div>
      <div className="panel-body flex-1 min-h-[180px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default PowerCurve;
