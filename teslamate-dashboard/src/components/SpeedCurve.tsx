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

interface SpeedCurveProps {
  positions: Position[];
}

/**
 * Speed-time curve for a selected drive.
 */
const SpeedCurve: React.FC<SpeedCurveProps> = ({ positions }) => {
  if (positions.length < 2) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header"><span className="text-tm-orange">◆</span> 速度曲线</div>
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
  const speeds = positions.map((p) => Math.max(0, p.speed ?? 0));
  const maxSpeed = Math.max(...speeds);

  const data = {
    labels,
    datasets: [{
      label: '速度 (km/h)',
      data: speeds,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.08)',
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
      y: { title: { display: true, text: 'km/h', color: '#00d4ff', font: { family: 'JetBrains Mono', size: 12 } }, ticks: { color: '#00d4ff', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(30,58,95,0.15)' }, border: { color: '#1e3a5f' } },
    },
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-orange">◆</span> 速度曲线
        <span className="ml-auto text-xs text-tm-text-dim">最高: {maxSpeed} km/h</span>
      </div>
      <div className="panel-body flex-1 min-h-[180px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default SpeedCurve;
