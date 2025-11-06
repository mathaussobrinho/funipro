import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, BarChart3, Building2, Archive, LogOut, Settings, Moon, Sun, HelpCircle, Mail } from 'lucide-react';

function Sidebar({ currentPage, onNavigate, user, onLogout }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Verificar preferência salva
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  // Mapeamento de módulos disponíveis
  const allModules = [
    { id: 'funnel', label: 'Funil de Vendas', icon: TrendingUp, key: 'funnel' },
    { id: 'inventory', label: 'Estoque', icon: Package, key: 'inventory' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, key: 'reports' },
    { id: 'sublocation', label: 'Sublocação', icon: Building2, key: 'sublocation' },
    { id: 'archived', label: 'Arquivados', icon: Archive, key: 'archived' },
  ];

  // Filtrar módulos baseado nos módulos permitidos do usuário
  // Se o usuário for Admin ou não tiver módulos definidos, mostrar todos
  const userModules = user?.modules || [];
  const userModuleKeys = userModules.map(m => m.key);
  const isAdmin = user?.role === 'Admin';
  
  const menuItems = allModules.filter(item => {
    // Admin sempre vê todos os módulos
    if (isAdmin) return true;
    // Se não há módulos definidos, mostrar todos (compatibilidade)
    if (userModuleKeys.length === 0) return true;
    // Caso contrário, mostrar apenas módulos permitidos
    return userModuleKeys.includes(item.key);
  });

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen fixed left-0 top-0 shadow-sm">
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <img src="/funipro.ico" alt="Funipro" className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Funipro
            </h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600 dark:text-gray-300" />}
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sistema de Gestão</p>
      </div>
      
      <nav className="p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Módulos</p>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="mb-4">
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.email || 'Usuário'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'Admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {user?.role === 'Admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={18} />
              <span className="text-sm">Administração</span>
            </button>
          )}
          <a
            href="mailto:suporte@sysmath.com.br"
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Mail size={18} />
            <span className="text-sm">Suporte</span>
          </a>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
