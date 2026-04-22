import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import Navbar from './Navbar.tsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-yellow-500/20 border-t-yellow-500 animate-spin"></div>
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
      <main>
        <Outlet />
      </main>
    </div>
  );
}
