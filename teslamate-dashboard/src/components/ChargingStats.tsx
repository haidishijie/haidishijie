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
import type { Charge } from '../types/teslamate';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ChargingStatsProps {
  charges: Charge[];
}

/**
 * Charging statistics: SOC distribution, time of day pattern.
 */
const ChargingStats: React.FC<ChargingStatsProps> = ({ charges }) => {
  // SOC range buckets
  const socBuckets = ['0-20', '20-40', '40-60', '60-80', '80-100'];
  const socCounts = [0, 0, 0, 0, 0];
  charges.forEach((c) => {
    const soc = c.start_battery_level ?? 50;
    if (soc < 20) socCounts[0]++;
    else if (soc < 40) socCounts[1]++;
    else if (soc < 60) socCounts[2]++;
    else if (soc < 80) socCounts[3]++;
    else socCounts[4]++;
  });

  // Hour of day distribution
  const hourBuckets = Array(24).fill(0);
  charges.forEach((c) => {
    const h = new Date(c.date).getHours();
    hourBuckets[h]++;
  });

  const hasData = charges.length > 0;
  const totalEnergy = charges.reduce((s, c) => s + (c.charge_energy_added ?? 0), 0);
  const totalCost = charges.reduce((s, c) => s + (c.cost ?? 0), 0);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-green">◆</span> 充电统计
        <span className="ml-auto text-xs text-tm-text-dim">{charges.length} 次充电</span>
      </div>
      <div className="panel-body flex-1 flex flex-col gap-3">
        {!hasData ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <span className="text-tm-text-dim text-sm">暂无充电数据</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="data-label">总能量</span>
                <div className="text-sm font-bold text-tm-green glow-text-green mt-0.5">{totalEnergy.toFixed(1)} kWh</div>
              </div>
              <div>
                <span className="data-label">总费用</span>
                <div className="text-sm font-bold text-tm-yellow mt-0.5">{totalCost > 0 ? `¥${totalCost.toFixed(2)}` : '---'}</div>
              </div>
              <div>
                <span className="data-label">平均电量变化</span>
                <div className="text-sm font-bold text-tm-cyan glow-text-cyan mt-0.5">
                  {(() => {
                    const avg = charges.reduce((s, c) => s + ((c.end_battery_level ?? 0) - (c.start_battery_level ?? 0)), 0) / charges.length;
                    return `${avg.toFixed(0)}%`;
                  })()}
                </div>
              </div>
            </div>
            {/* SOC distribution */}
            <div className="flex-1 min-h-[150px]">
              <Bar
                data={{
                  labels: socBuckets,
                  datasets: [{
                    label: '起始电量分布',
                    data: socCounts,
                    backgroundColor: ['#ff2d55', '#ff6b35', '#ffd700', '#00d4ff', '#00ff41'],
                    borderColor: ['#ff2d55', '#ff6b35', '#ffd700', '#00d4ff', '#00ff41'],
                    borderWidth: 1,
                    borderRadius: 3,
                  }],
                }}
                options={{
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
                    x: { ticks: { color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(30,58,95,0.3)' }, border: { color: '#1e3a5f' }, title: { display: true, text: '起始电量 %', color: '#6b7fa3', font: { family: 'JetBrains Mono', size: 11 } } },
                    y: { ticks: { color: '#00d4ff', font: { family: 'JetBrains Mono', size: 11 }, stepSize: 1 }, grid: { color: 'rgba(30,58,95,0.15)' }, border: { color: '#1e3a5f' } },
                  },
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChargingStats;
