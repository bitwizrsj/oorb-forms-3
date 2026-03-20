import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import { useDashboard } from './DashboardContext';

const Header: React.FC = () => {
  const { user, getInitials } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { searchTerm, setSearchTerm } = useDashboard();

  return (
    <div className="fixed w-full md:w-auto lg:left-64 lg:right-0 bg-transparent z-30">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl mx-4 sm:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search forms and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-3 p-2 rounded-sm hover:bg-gray-100 transition-colors"
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {getInitials()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </button>

            {showProfileDropdown && <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;