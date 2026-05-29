import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { timeAgo } from '../utils/formatters';

interface HeaderProps {
  carName: string | null;
  lastUpdated: Date | null;
  countdown: number;
  status: string | null;
  isLoading: boolean;
  hasError: boolean;
  onRefresh: () => void;
}

/**
 * Dashboard header bar with title, navigation, status indicators, and refresh controls.
 */
const Header: React.FC<HeaderProps> = ({
  carName,
  lastUpdated,
  countdown,
  status,
  isLoading,
  hasError,
  onRefresh,
}) => {
  const location = useLocation();
  const isOnline = !hasError && status !== null;

  const navLinks = [
    { path: '/', label: '仪表盘', icon: '◉' },
    { path: '/commute', label: '通勤对比', icon: '⇄' },
  ];

  return (
    <header className="border-b border-tm-border bg-tm-panel/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-5 py-3.5 flex items-center justify-between">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-tm-cyan/10 border border-tm-cyan/30 flex items-center justify-center text-tm-cyan text-lg font-bold">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-bold text-tm-cyan glow-text-cyan tracking-wider uppercase">
              TeslaMate 控制中心
            </h1>
            <p className="text-xs text-tm-text-dim tracking-wider">
              任务控制 // {carName ?? '等待车辆连接'}
            </p>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1.5 ml-5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-1.5 text-xs uppercase tracking-wider rounded-md border transition-all ${
                    isActive
                      ? 'border-tm-cyan/50 text-tm-cyan bg-tm-cyan/10'
                      : 'border-tm-border/30 text-tm-text-dim hover:border-tm-cyan/30 hover:text-tm-text'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Status indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`status-dot ${isOnline ? 'status-online' : 'status-offline'}`} />
            <span className="text-sm text-tm-text-dim">
              {isOnline ? '在线' : hasError ? '异常' : '离线'}
            </span>
          </div>

          <div className="text-xs text-tm-text-dim font-mono">
            <span className="text-tm-text-dim">系统时间</span>{' '}
            <span className="text-tm-cyan">
              {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
            </span>
          </div>

          {lastUpdated && (
            <div className="text-xs text-tm-text-dim">
              <span className="text-tm-text-dim">数据更新</span>{' '}
              <span className="text-tm-green glow-text-green">{timeAgo(lastUpdated)}</span>
            </div>
          )}
        </div>

        {/* Right: Refresh controls */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-tm-text-dim">
            下次同步: <span className="text-tm-orange">{countdown}s</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs uppercase tracking-wider border border-tm-cyan/30 text-tm-cyan rounded-md hover:bg-tm-cyan/10 hover:border-tm-cyan/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? '同步中...' : '刷新'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
