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

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (pct / 100) * circumference;
  const color = pct >= 100 ? '#00ff41' : pct >= 60 ? '#00d4ff' : '#ff6b35';

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-cyan">◆</span> 本周里程
      </div>
      <div className="panel-body flex-1 flex items-center justify-center gap-6">
        {/* Ring gauge */}
        <div className="circular-gauge">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(30,58,95,0.4)" strokeWidth="6" />
            {/* Goal indicator */}
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,215,0,0.2)" strokeWidth="2" strokeDasharray="4 4" />
            {/* Progress arc */}
            <circle
              cx="70" cy="70" r={radius} fill="none"
              stroke={color} strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 1.5s ease-out' }}
            />
          </svg>
          <div className="gauge-text">
            <span className={`text-2xl font-bold ${pct >= 80 ? 'text-tm-green glow-text-green' : 'text-tm-cyan glow-text-cyan'}`}>
              {pct.toFixed(0)}%
            </span>
            <span className="text-xs text-tm-text-dim uppercase tracking-wider">目标</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div>
            <span className="data-label">本周</span>
            <div className="text-xl font-bold text-tm-cyan glow-text-cyan mt-0.5">{distance.toFixed(0)} km</div>
          </div>
          <div>
            <span className="data-label">目标</span>
            <div className="text-lg font-bold text-tm-yellow mt-0.5">{WEEK_GOAL_KM} km</div>
          </div>
          <div>
            <span className="data-label">剩余</span>
            <div className={`text-lg font-bold mt-0.5 ${remaining > 0 ? 'text-tm-orange glow-text-orange' : 'text-tm-green glow-text-green'}`}>
              {remaining > 0 ? `${remaining.toFixed(0)} km` : '已达标'}
            </div>
          </div>
          <div>
            <span className="data-label">行程</span>
            <div className="text-lg font-bold text-tm-text-dim mt-0.5">{driveCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyMileage;
