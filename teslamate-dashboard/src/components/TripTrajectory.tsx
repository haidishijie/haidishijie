import React from 'react';
import type { Position } from '../types/teslamate';

interface TripTrajectoryProps {
  positions: Position[];
}

/**
 * GPS trajectory scatter plot for a selected drive.
 * Simple X/Y scatter since we don't have a map library.
 * Each point colored by speed (green=slow, red=fast).
 */
const TripTrajectory: React.FC<TripTrajectoryProps> = ({ positions }) => {
  if (positions.length < 2) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header"><span className="text-tm-cyan">◆</span> 行程轨迹</div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">GPS 数据不足</span>
        </div>
      </div>
    );
  }

  const validPositions = positions.filter((p) => p.latitude !== 0 && p.longitude !== 0);
  if (validPositions.length < 2) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header"><span className="text-tm-cyan">◆</span> 行程轨迹</div>
        <div className="panel-body flex items-center justify-center h-48">
          <span className="text-tm-text-dim text-sm">GPS 坐标不可用</span>
        </div>
      </div>
    );
  }

  // Compute bounding box
  const lats = validPositions.map((p) => p.latitude);
  const lngs = validPositions.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const maxSpeed = Math.max(...validPositions.map((p) => p.speed ?? 0), 1);

  // SVG dimensions
  const width = 400;
  const height = 250;
  const pad = 10;

  const points = validPositions.map((p, idx) => {
    const x = pad + ((p.longitude - minLng) / lngRange) * (width - 2 * pad);
    const y = pad + ((1 - (p.latitude - minLat) / latRange)) * (height - 2 * pad);
    const speed = p.speed ?? 0;
    const speedPct = speed / maxSpeed;
    // Color: green (slow) → cyan → orange → red (fast)
    let r = 0; let g = 255; let b = 65;
    if (speedPct > 0.5) {
      r = Math.round(255 * (speedPct - 0.5) * 2);
      g = Math.round(255 - 148 * (speedPct - 0.5) * 2);
      b = Math.round(65 - 12 * (speedPct - 0.5) * 2);
    }
    if (speedPct > 0.75) {
      r = 255;
      g = Math.round(107 - 62 * (speedPct - 0.75) * 4);
      b = Math.round(53 - 53 * (speedPct - 0.75) * 4);
    }
    return { x, y, r, g, b, idx };
  });

  // Create path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-cyan">◆</span> 行程轨迹
        <span className="ml-auto text-xs text-tm-text-dim">{validPositions.length} 个点</span>
      </div>
      <div className="panel-body flex-1 flex items-center justify-center">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-full">
          <rect width={width} height={height} fill="rgba(10, 14, 23, 0.5)" rx="4" />
          {/* Grid */}
          {Array.from({ length: 5 }, (_, i) => {
            const x = pad + (i / 4) * (width - 2 * pad);
            const y = pad + (i / 4) * (height - 2 * pad);
            return [
              <line key={`vg${i}`} x1={x} y1={pad} x2={x} y2={height - pad} stroke="rgba(30,58,95,0.3)" strokeWidth="0.5" />,
              <line key={`hg${i}`} x1={pad} y1={y} x2={width - pad} y2={y} stroke="rgba(30,58,95,0.3)" strokeWidth="0.5" />,
            ];
          })}
          {/* Path line */}
          <path d={pathD} fill="none" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="1.5" />
          {/* Points */}
          {points.map((p) => (
            <circle
              key={p.idx}
              cx={p.x}
              cy={p.y}
              r={2}
              fill={`rgb(${p.r},${p.g},${p.b})`}
              opacity={0.8}
            />
          ))}
          {/* Start/End markers */}
          <circle cx={points[0]?.x} cy={points[0]?.y} r={4} fill="#00ff41" stroke="#0a0e17" strokeWidth="1" />
          <circle cx={points[points.length - 1]?.x} cy={points[points.length - 1]?.y} r={4} fill="#ff2d55" stroke="#0a0e17" strokeWidth="1" />
          {/* Legend */}
          <text x={pad + 4} y={height - pad - 4} fill="#00ff41" fontSize="8" fontFamily="JetBrains Mono">起点</text>
          <text x={width - pad - 20} y={height - pad - 4} fill="#ff2d55" fontSize="8" fontFamily="JetBrains Mono">终点</text>
        </svg>
      </div>
      <div className="px-4 pb-2 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-tm-green" />
          <span className="text-[8px] text-tm-text-dim">0 km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-tm-cyan" />
          <span className="text-[8px] text-tm-text-dim">50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-tm-orange" />
          <span className="text-[8px] text-tm-text-dim">75%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-tm-red" />
          <span className="text-[8px] text-tm-text-dim">{maxSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
};

export default TripTrajectory;
