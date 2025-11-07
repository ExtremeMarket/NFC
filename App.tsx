import React, { useState, useEffect } from 'react';
import AdminPanel from './components/panels/AdminPanel';
import PosPanel from './components/panels/PosPanel';
import UserPanel from './components/panels/UserPanel';
import AuthPanel from './components/panels/AuthPanel';
import StatisticsPanel from './components/panels/StatisticsPanel';
import { CreditCardIcon, ShoppingCartIcon, UsersIcon, LoginIcon, LogoutIcon, ChartBarIcon } from './components/icons';
import { useAppContext } from './context/AppContext';
import { UserRole } from './types';

export type Panel = 'pos' | 'admin' | 'user' | 'auth' | 'statistics';

const App: React.FC = () => {
  const { currentUser, logout } = useAppContext();
  const [activePanel, setActivePanel] = useState<Panel>('auth');

  const handleLogout = () => {
    logout();
    setActivePanel('auth');
  }

  const isAdmin = currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN);
  const isSuperAdmin = currentUser && currentUser.role === UserRole.SUPER_ADMIN;
  const isUser = currentUser && currentUser.role === UserRole.USER;

  const navItems = [
    { id: 'pos', label: 'Point of Sale', icon: <ShoppingCartIcon className="w-5 h-5 mr-2" />, show: isAdmin },
    { id: 'admin', label: 'Admin Panel', icon: <UsersIcon className="w-5 h-5 mr-2" />, show: isAdmin },
    { id: 'statistics', label: 'Statistics', icon: <ChartBarIcon className="w-5 h-5 mr-2" />, show: isAdmin },
    { id: 'user', label: 'My Wallet', icon: <CreditCardIcon className="w-5 h-5 mr-2" />, show: isUser || isSuperAdmin },
    { id: 'auth', label: 'Login', icon: <LoginIcon className="w-5 h-5 mr-2" />, show: !currentUser },
  ];

  const renderPanel = () => {
    if (currentUser) {
      if (isAdmin) {
          switch (activePanel) {
              case 'pos': return <PosPanel />;
              case 'admin': return <AdminPanel />;
              case 'statistics': return <StatisticsPanel />;
              case 'user':
                  if (isSuperAdmin) return <UserPanel />;
                  return <AdminPanel />; // Fallback for regular admin
              case 'auth': // Admins shouldn't see auth panel when logged in
                  return <AdminPanel />; // Default to admin panel
              default: return <AdminPanel />;
          }
      }
      if (isUser) {
        // A regular user can only see their wallet.
        return <UserPanel />;
      }
    }
    
    // Not logged in: always show the authentication panel.
    return <AuthPanel setActivePanel={setActivePanel} />;
  };
  
  // Effect to handle panel redirection after login/logout
  useEffect(() => {
    if (currentUser) {
        if (isAdmin && activePanel === 'auth') {
            setActivePanel('admin');
        } else if (isUser && activePanel !== 'user') {
            setActivePanel('user');
        }
    } else {
        // If logged out, force the auth panel to be shown.
        if (activePanel !== 'auth') {
            setActivePanel('auth');
        }
    }
  }, [currentUser, activePanel, isAdmin, isUser]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4 md:flex md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-teal-400">NFC Event Wallet</h1>
          {currentUser && (
            <nav className="mt-4 md:mt-0 flex items-center space-x-2 md:space-x-4">
                {navItems.filter(i => i.show).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActivePanel(item.id as Panel)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
                        ${activePanel === item.id 
                          ? 'bg-teal-500 text-white shadow-md' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                      {item.icon}
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                ))}
                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <LogoutIcon className="w-5 h-5 mr-2" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                )}
            </nav>
          )}
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {renderPanel()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Powered by React & Tailwind CSS</p>
      </footer>
    </div>
  );
};

export default App;