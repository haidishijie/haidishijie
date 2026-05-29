/**
 * Format temperature with unit
 */
export function formatTemp(temp: number | string | null | undefined, decimals = 1): string {
  if (temp == null) return '---';
  const n = typeof temp === 'string' ? parseFloat(temp) : temp;
  if (isNaN(n)) return '---';
  return `${n.toFixed(decimals)}°C`;
}

/**
 * Format distance in kilometers
 */
export function formatKm(km: number | string | null | undefined, decimals = 1): string {
  if (km == null) return '---';
  const n = typeof km === 'string' ? parseFloat(km) : km;
  if (isNaN(n)) return '---';
  if (n >= 1000) return `${(n / 1000).toFixed(decimals)}k km`;
  return `${n.toFixed(decimals)} km`;
}

/**
 * Format battery percentage
 */
export function formatSoc(soc: number | string | null | undefined): string {
  if (soc == null) return '---';
  const n = typeof soc === 'string' ? parseFloat(soc) : soc;
  if (isNaN(n)) return '---';
  return `${Math.round(n)}%`;
}

/**
 * Format power in kW
 */
export function formatPower(power: number | string | null | undefined): string {
  if (power == null) return '---';
  const n = typeof power === 'string' ? parseFloat(power) : power;
  if (isNaN(n)) return '---';
  return `${Math.round(n)} kW`;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number | string | null | undefined): string {
  if (minutes == null) return '---';
  const n = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (isNaN(n)) return '---';
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format energy in kWh
 */
export function formatEnergy(kwh: number | string | null | undefined): string {
  if (kwh == null) return '---';
  const n = typeof kwh === 'string' ? parseFloat(kwh) : kwh;
  if (isNaN(n)) return '---';
  return `${n.toFixed(1)} kWh`;
}

/**
 * Format date to local display string
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format odometer in km
 */
export function formatOdometer(km: number | string | null | undefined): string {
  if (km == null) return '---';
  const n = typeof km === 'string' ? parseFloat(km) : km;
  if (isNaN(n)) return '---';
  return `${Math.round(n).toLocaleString()} km`;
}

/**
 * Calculate efficiency percentage from drive data
 */
export function calcEfficiency(startRange: number | null, endRange: number | null, distance: number | null): number | null {
  if (startRange == null || endRange == null || distance == null || distance === 0) return null;
  const rangeUsed = startRange - endRange;
  return (distance / rangeUsed) * 100;
}

/**
 * Get battery level color class based on percentage
 */
export function getBatteryColor(soc: number | string | null | undefined): string {
  if (soc == null) return 'text-tm-text-dim';
  const n = typeof soc === 'string' ? parseFloat(soc) : soc;
  if (isNaN(n)) return 'text-tm-text-dim';
  if (n >= 80) return 'text-tm-green glow-text-green';
  if (n >= 40) return 'text-tm-cyan glow-text-cyan';
  if (n >= 20) return 'text-tm-orange glow-text-orange';
  return 'text-tm-red';
}

/**
 * Get battery level bar color based on percentage
 */
export function getBatteryBarColor(soc: number | string | null | undefined): string {
  if (soc == null) return 'bg-tm-text-dim';
  const n = typeof soc === 'string' ? parseFloat(soc) : soc;
  if (isNaN(n)) return 'bg-tm-text-dim';
  if (n >= 80) return 'bg-tm-green';
  if (n >= 40) return 'bg-tm-cyan';
  if (n >= 20) return 'bg-tm-orange';
  return 'bg-tm-red';
}

/**
 * Format a timestamp to show time ago
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return '刚刚';
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小时前`;
}
