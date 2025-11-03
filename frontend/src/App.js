import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Sidebar from './components/Sidebar';
import InventoryPage from './components/InventoryPage';
import ReportsPage from './components/ReportsPage';
import SubLocationPage from './components/SubLocationPage';
import ArchivedPage from './components/ArchivedPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('funnel');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setCurrentPage('funnel');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('funnel');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'funnel':
        return <Dashboard user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />;
      case 'inventory':
        return <InventoryPage user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />;
      case 'reports':
        return <ReportsPage user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />;
      case 'sublocation':
        return <SubLocationPage user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />;
      case 'archived':
        return <ArchivedPage user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />;
      case 'admin':
        return <AdminPanel user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />;
      default:
        return <Dashboard user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />
        <div className="flex-1 ml-64">
          {renderPage()}
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Desenvolvido por</p>
          <a 
            href="https://sysmath.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-gray-600 dark:text-gray-300 font-medium text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            Sysmath.com.br
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;