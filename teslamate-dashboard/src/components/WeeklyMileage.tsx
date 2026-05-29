import React from 'react';
import type { WeeklyResponse } from '../utils/api';

interface WeeklyMileageProps {
  weekly: WeeklyResponse | null;
}

const WEEK_GOAL_KM = 300;

/**
 * Weekly mileage ring progress: shows this week's distance vs goal.
 */
const WeeklyMileage: React.FC<WeeklyMileageProps> = ({ weekly }) => {
  const distance = weekly?.totalDistance ?? 0;
  const driveCount = weekly?.driveCount ?? 0;
  const pct = Math.min(100, (distance / WEEK_GOAL_KM) * 100);
  const remaining = Math.max(0, WEEK_GOAL_KM - distance);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (pct / 100) * circumference;
  const color = pct >= 100 ? '#00ff41' : pct >= 60 ? '#00d4ff' : '#ff6b35';

  return (
    <div className="panel">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-tm-border/40 min-h-[36px]">
        <span className="text-[10px] text-tm-cyan/60">◆</span>
        <h3 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-white/35">本周里程</h3>
        <span className="ml-auto text-[10px] text-white/20 font-mono">目标 {WEEK_GOAL_KM} km</span>
      </div>
      <div className="p-4 flex items-center gap-5">
        {/* Ring gauge */}
        <div className="circular-gauge shrink-0" style={{ width: '110px', height: '110px' }}>
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(30,58,95,0.4)" strokeWidth="6" />
            <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,215,0,0.15)" strokeWidth="2" strokeDasharray="3 3" />
            <circle
              cx="55" cy="55" r={radius} fill="none"
              stroke={color} strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 1.5s ease-out' }}
            />
          </svg>
          <div className="gauge-text">
            <span className={`text-xl font-bold ${pct >= 80 ? 'text-tm-green' : 'text-tm-cyan'}`}>
              {pct.toFixed(0)}%
            </span>
            <span className="text-[10px] text-white/25 uppercase tracking-wider">完成</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-3">
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-[0.03em]">本周</span>
            <div className="font-mono text-sm font-medium text-white/30 mt-0.5">{distance.toFixed(0)} km</div>
          </div>
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-[0.03em]">目标</span>
            <div className="font-mono text-sm font-medium text-tm-yellow mt-0.5">{WEEK_GOAL_KM} km</div>
          </div>
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-[0.03em]">剩余</span>
            <div className={`font-mono text-sm font-medium mt-0.5 ${remaining > 0 ? 'text-tm-orange' : 'text-tm-green'}`}>
              {remaining > 0 ? `${remaining.toFixed(0)} km` : '已达标'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-white/20 uppercase tracking-[0.03em]">行程</span>
            <div className="font-mono text-sm font-medium text-white/30 mt-0.5">{driveCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyMileage;
