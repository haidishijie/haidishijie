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
import type { Position } from '../types/teslamate';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface TemperatureCurveProps {
  positions: Position[];
}

/**
 * Temperature curve: outside and inside temperature over a drive.
 */
const TemperatureCurve: React.FC<TemperatureCurveProps> = ({ positions }) => {
  if (positions.length < 2) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header"><span className="text-tm-orange">◆</span> 温度曲线</div>
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
  const outsideTemps = positions.map((p) => p.outside_temp ?? 0);
  const insideTemps = positions.map((p) => p.inside_temp ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: '室外 (°C)',
        data: outsideTemps,
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255, 107, 53, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
      {
        label: '车内 (°C)',
        data: insideTemps,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
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
      tooltip: { backgroundColor: '#111827', borderColor: '#1e3a5f', borderWidth: 1, titleFont: { family: 'JetBrains Mono', size: 13 }, bodyFont: { family: 'JetBrains Mono', size: 12 }, titleColor: '#e0e7ff', bodyColor: '#6b7fa3' },
    },
    scales: {
      x: { ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 8 }, maxTicksLimit: 15 }, grid: { color: 'rgba(30,58,95,0.3)' }, border: { color: '#1e3a5f' } },
      y: {
        title: { display: true, text: '°C', color: '#ff6b35', font: { family: 'JetBrains Mono', size: 12 } },
        ticks: { color: '#ff6b35', font: { family: 'JetBrains Mono', size: 11 }, callback: (v: string | number) => `${v}°` },
        grid: { color: 'rgba(30,58,95,0.15)' },
        border: { color: '#1e3a5f' },
      },
    },
  };

  const avgOutside = outsideTemps.length > 0 ? outsideTemps.reduce((a, b) => a + b, 0) / outsideTemps.length : 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-orange">◆</span> 温度曲线
        <span className="ml-auto text-xs text-tm-text-dim">平均: {avgOutside.toFixed(1)}°C</span>
      </div>
      <div className="panel-body flex-1 min-h-[180px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default TemperatureCurve;
