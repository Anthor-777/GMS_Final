import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Analytics from './pages/Analytics.jsx';
import Attendance from './pages/Attendance.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Equipment from './pages/Equipment.jsx';
import Login from './pages/Login.jsx';
import MaintenanceLogs from './pages/MaintenanceLogs.jsx';
import Members from './pages/Members.jsx';
import MembershipPlans from './pages/MembershipPlans.jsx';
import Payments from './pages/Payments.jsx';
import Reports from './pages/Reports.jsx';
import Sessions from './pages/Sessions.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import Trainers from './pages/Trainers.jsx';

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch('');
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="lg:pl-64">
        <Topbar pathname={location.pathname} search={search} onSearch={setSearch} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet context={{ search, setSearch }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Guest>
            <Login />
          </Guest>
        }
      />
      <Route
        element={
          <Protected>
            <Shell />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/plans" element={<MembershipPlans />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/maintenance" element={<MaintenanceLogs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
