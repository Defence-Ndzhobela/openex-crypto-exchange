import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useMarket } from '../../context/MarketContext.tsx';
import { LayoutDashboard, ArrowLeftRight, Wallet, ListTodo, LogOut, Bitcoin, Menu, X } from 'lucide-react';
import { cn, formatCurrency } from '../../utils.ts';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { btcPrice } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Trade', path: '/trade', icon: ArrowLeftRight },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Orders', path: '/orders', icon: ListTodo },
  ];

  return (
    <>
    <nav className="bg-[#111] border-b border-[#333] sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="bg-yellow-500 rounded p-1.5">
              <Bitcoin className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase italic">OpenEx</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm",
                    isActive 
                      ? "bg-[#222] text-yellow-500" 
                      : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-gray-300 hover:text-white rounded-md hover:bg-[#1a1a1a] transition-colors"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">BTC / USD</span>
            <span className="text-sm font-mono text-green-400">{formatCurrency(btcPrice)}</span>
          </div>

          <div className="h-8 w-[1px] bg-[#333] hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs text-gray-400">{user.name}</span>
              <span className="text-[10px] text-yellow-500 font-mono tracking-tighter">Verified</span>
            </div>
            <button
              onClick={handleLogout}
              type="button"
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#222] bg-[#0d0d0d] px-3 py-3" role="menu" aria-label="Mobile navigation">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    isActive ? 'bg-[#222] text-yellow-500' : 'bg-[#141414] text-gray-300 hover:text-white'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>

    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#222] bg-[#0d0d0d]/95 backdrop-blur">
      <div className="grid grid-cols-4 px-2 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={`bottom-${item.path}`}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
                isActive ? 'text-yellow-500 bg-[#1b1b1b]' : 'text-gray-500 hover:text-gray-200'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="mb-1 h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
    </>
  );
}
