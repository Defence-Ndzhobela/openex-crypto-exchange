import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import Navbar from './Navbar.tsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center" role="status" aria-live="polite">
        <div className="relative text-center">
          <div className="w-12 h-12 rounded-full border-2 border-yellow-500/20 border-t-yellow-500 animate-spin mx-auto"></div>
          <p className="mt-3 text-xs text-[var(--text-muted)] uppercase tracking-wider">Loading workspace</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-yellow-500/30 selection:text-yellow-500">
      <Navbar />
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
