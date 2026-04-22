import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useMarket } from '../../context/MarketContext.tsx';
import { LayoutDashboard, ArrowLeftRight, Wallet, ListTodo, LogOut, Bitcoin } from 'lucide-react';
import { cn, formatCurrency } from '../../utils.ts';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { btcPrice } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Trade', path: '/trade', icon: ArrowLeftRight },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Orders', path: '/orders', icon: ListTodo },
  ];

  return (
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
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
