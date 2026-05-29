import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTeslaMateData } from './hooks/useTeslaMateData';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CommuteCompare from './pages/CommuteCompare';

/**
 * Root application component with routing.
 * Two pages: Dashboard (/) and Commute Compare (/commute).
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

/**
 * Inner routes component that shares no hook state across pages.
 * Each page manages its own data fetching independently.
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/commute" element={<CommutePage />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
};

/**
 * Commute page wrapper: embeds the CommuteCompare component directly.
 * The CommuteCompare component handles its own data fetching.
 */
const CommutePage: React.FC = () => {
  return <CommuteCompare />;
};

export default App;
