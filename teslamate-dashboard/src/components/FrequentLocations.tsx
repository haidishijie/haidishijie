import React from 'react';
import type { LocationsResponse } from '../utils/api';
import { formatDuration } from '../utils/formatters';

interface FrequentLocationsProps {
  locations: LocationsResponse | null;
}

/**
 * Frequently visited locations list with visit counts.
 */
const FrequentLocations: React.FC<FrequentLocationsProps> = ({ locations }) => {
  const geofences = locations?.geofences ?? [];
  const addresses = locations?.addresses ?? [];

  const hasData = geofences.length > 0 || addresses.length > 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="text-tm-cyan">◆</span> 常用地点
        <span className="ml-auto text-xs text-tm-text-dim">{geofences.length + addresses.length} 个地点</span>
      </div>
      <div className="panel-body flex-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
        {!hasData ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <span className="text-tm-text-dim text-sm">暂无地点数据</span>
          </div>
        ) : (
          <div className="space-y-2">
            {geofences.map((g) => (
              <div key={g.id} className="flex items-center gap-3 py-1.5 border-b border-tm-border/20">
                <span className="text-tm-green text-xs">▣</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-tm-text truncate">{g.name}</div>
                  <div className="text-xs text-tm-text-dim">平均停留: {formatDuration(g.avg_duration)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-tm-cyan glow-text-cyan">{g.visit_count}</div>
                  <div className="text-xs text-tm-text-dim">次访问</div>
                </div>
              </div>
            ))}
            {addresses.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-1.5 border-b border-tm-border/20">
                <span className="text-tm-orange text-xs">◉</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-tm-text truncate">{a.name || 'Unknown'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-tm-text-dim">{a.visit_count}</div>
                  <div className="text-xs text-tm-text-dim">次访问</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrequentLocations;
