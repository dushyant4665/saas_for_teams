import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, CreditCard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const getFirstLetterAvatar = (name) => {
    const letter = (name || 'U').trim().charAt(0).toUpperCase() || 'U';
    const bg = '#e5e7eb'; // gray-200
    const fg = '#374151'; // gray-700
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
  <rect width='100%' height='100%' rx='32' ry='32' fill='${bg}'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui, Arial' font-size='28' font-weight='600' fill='${fg}'>${letter}</text>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpgrade = () => {
    // This will be handled by the parent component
    window.location.href = '/dashboard?upgrade=true';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">TeamPulse</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user?.subscription?.status === 'free' && (
              <button
                onClick={handleUpgrade}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Upgrade to Pro
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <img
                  src={user?.photoURL || getFirstLetterAvatar(user?.displayName)}
                  alt={user?.displayName}
                  className="h-8 w-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFirstLetterAvatar(user?.displayName);
                  }}
                />
                <span className="text-sm font-medium">{user?.displayName}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                    {user?.email}
                  </div>
                  
                  {user?.subscription?.status === 'free' && (
                    <button
                      onClick={handleUpgrade}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;



