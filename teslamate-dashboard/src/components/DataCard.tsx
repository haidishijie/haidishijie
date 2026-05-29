import React from 'react';

interface DataCardProps {
  label: string;
  value: string;
  unit?: string;
  colorClass?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

/**
 * Generic data display card with label, value, and optional unit/icon.
 * Fits the NASA mission control aesthetic.
 */
const DataCard: React.FC<DataCardProps> = ({
  label,
  value,
  unit,
  colorClass = 'text-tm-cyan glow-text-cyan',
  icon,
  subtitle,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="data-label flex items-center gap-1">
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className={`data-value ${colorClass}`}>{value}</span>
        {unit && <span className="text-xs text-tm-text-dim">{unit}</span>}
      </div>
      {subtitle && <span className="text-xs text-tm-text-dim">{subtitle}</span>}
    </div>
  );
};

export default DataCard;
