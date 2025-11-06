import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { BarChart, LineChart, PieChart, Bar, Line, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_URL } from '../config';

function ReportsPage({ user, onLogout, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [subLocations, setSubLocations] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Verificar módulos do usuário
    const userModules = user?.modules || [];
    const userModuleKeys = userModules.map(m => m.key);
    const isAdmin = user?.role === 'Admin';
    
    try {
      // Buscar dashboard (sempre disponível se tiver acesso a reports)
      const hasReportsAccess = isAdmin || userModuleKeys.length === 0 || userModuleKeys.includes('reports');
      if (hasReportsAccess) {
        const dashboardRes = await fetch(`${API_URL}/deals/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (dashboardRes.ok) {
          setDashboard(await dashboardRes.json());
        }
      }

      // Buscar sublocações apenas se tiver acesso ao módulo
      const hasSublocationAccess = isAdmin || userModuleKeys.length === 0 || userModuleKeys.includes('sublocation');
      if (hasSublocationAccess) {
        const subLocRes = await fetch(`${API_URL}/sublocation`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (subLocRes.ok) {
          setSubLocations(await subLocRes.json() || []);
        }
      } else {
        setSubLocations([]);
      }

      // Buscar inventário apenas se tiver acesso ao módulo
      const hasInventoryAccess = isAdmin || userModuleKeys.length === 0 || userModuleKeys.includes('inventory');
      if (hasInventoryAccess) {
        const invRes = await fetch(`${API_URL}/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (invRes.ok) {
          setInventories(await invRes.json() || []);
        }
      } else {
        setInventories([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular dados para gráficos
  const getChartData = () => {
    // Verificar módulos do usuário
    const userModules = user?.modules || [];
    const userModuleKeys = userModules.map(m => m.key);
    const isAdmin = user?.role === 'Admin';
    const hasSublocationAccess = isAdmin || userModuleKeys.length === 0 || userModuleKeys.includes('sublocation');
    const hasInventoryAccess = isAdmin || userModuleKeys.length === 0 || userModuleKeys.includes('inventory');
    
    // Dados mensais de receita
    const monthlyData = dashboard?.monthlyRevenues?.map(m => ({
      month: m.monthName,
      bruto: m.grossValue,
      liquido: m.netValue,
      descontos: m.totalDiscounts,
      total: m.totalDeals
    })) || [];

    // Receita por método de pagamento
    const paymentData = [];
    if (dashboard?.monthlyRevenues) {
      const paymentMethods = {};
      dashboard.monthlyRevenues.forEach(m => {
        Object.entries(m.revenueByPaymentMethod || {}).forEach(([method, value]) => {
          paymentMethods[method] = (paymentMethods[method] || 0) + value;
        });
      });
      
      Object.entries(paymentMethods).forEach(([method, value]) => {
        paymentData.push({
          name: method === 'Cartao' ? 'Cartão' : method === 'Pix' ? 'PIX' : method,
          value: value
        });
      });
    }

    // Status dos negócios
    const statusData = dashboard?.dealsByStatus?.map(d => ({
      name: d.status === 0 ? 'Lead' : d.status === 1 ? 'Qualificado' : d.status === 2 ? 'Proposta' : d.status === 3 ? 'Negociação' : 'Fechado',
      quantidade: d.count,
      valor: d.deals.reduce((sum, deal) => sum + (deal.value || 0), 0)
    })) || [];

    // Origens de dinheiro
    const closedDeals = dashboard?.dealsByStatus?.find(d => d.status === 4)?.deals || [];
    const totalFromClosed = closedDeals.reduce((sum, deal) => {
      const grossValue = deal.grossValue > 0 ? deal.grossValue : deal.value || 0;
      return sum + grossValue;
    }, 0);
    
    // Incluir sublocação apenas se tiver acesso
    const totalFromSubLocation = hasSublocationAccess 
      ? subLocations.reduce((sum, sub) => sum + (sub.netValue || 0), 0)
      : 0;
    
    const originData = [
      { name: 'Negócios Fechados', value: totalFromClosed, porcentagem: 0 }
    ];
    
    // Adicionar sublocação apenas se tiver acesso e houver valor
    if (hasSublocationAccess && totalFromSubLocation > 0) {
      originData.push({ name: 'Sublocação', value: totalFromSubLocation, porcentagem: 0 });
    }
    
    const totalOrigin = originData.reduce((sum, item) => sum + item.value, 0);
    originData.forEach(item => {
      item.porcentagem = totalOrigin > 0 ? (item.value / totalOrigin) * 100 : 0;
    });

    // Gastos previstos (estoque) - apenas se tiver acesso
    const totalInventoryCost = hasInventoryAccess 
      ? inventories.reduce((sum, inv) => sum + (inv.quantity * inv.unitPrice), 0)
      : 0;
    
    // Dinheiro a entrar (Total Fechado + Sublocação)
    const moneyToEnter = totalFromClosed + totalFromSubLocation;

    return {
      monthlyData,
      paymentData,
      statusData,
      originData,
      totalInventoryCost,
      moneyToEnter,
      totalFromClosed,
      totalFromSubLocation,
      hasSublocationAccess,
      hasInventoryAccess
    };
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Relatórios e Análises
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Visualize seus dados em tempo real</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Fechado</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(chartData.totalFromClosed)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </div>

          {chartData.hasSublocationAccess && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Sublocação</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(chartData.totalFromSubLocation)}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <Package className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Dinheiro a Entrar</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {formatCurrency(chartData.moneyToEnter)}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                <ArrowUpCircle className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
            </div>
          </div>

          {chartData.hasInventoryAccess && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Gastos Previstos</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(chartData.totalInventoryCost)}
                  </p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                  <ArrowDownCircle className="text-red-600 dark:text-red-400" size={24} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Receita Mensal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Receita Mensal</h3>
            {chartData.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="bruto" fill="#3b82f6" name="Valor Bruto" />
                  <Bar dataKey="liquido" fill="#10b981" name="Valor Líquido" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>

          {/* Origem do Dinheiro - apenas se tiver acesso a sublocação ou houver negócios fechados */}
          {(chartData.hasSublocationAccess || chartData.totalFromClosed > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Origem do Dinheiro</h3>
              {chartData.originData.length > 0 && chartData.originData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.originData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, porcentagem }) => `${name}: ${porcentagem.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.originData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum dado disponível</p>
              )}
            </div>
          )}

          {/* Receita por Método de Pagamento */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Receita por Método de Pagamento</h3>
            {chartData.paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.paymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>

          {/* Status dos Negócios */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Status dos Negócios</h3>
            {chartData.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quantidade" fill="#f59e0b" name="Quantidade" />
                  <Bar yAxisId="right" dataKey="valor" fill="#ef4444" name="Valor Total (R$)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Gráfico de Linha - Evolução Temporal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Evolução de Receita</h3>
          {chartData.monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="bruto" stroke="#3b82f6" name="Valor Bruto" />
                <Line type="monotone" dataKey="liquido" stroke="#10b981" name="Valor Líquido" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
