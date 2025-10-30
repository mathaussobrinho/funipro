import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Calendar, Plus, LogOut, Settings, Edit, Trash2, Phone, Mail, X, Save } from 'lucide-react';

function Dashboard({ user, onLogout, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [draggedDeal, setDraggedDeal] = useState(null);

  const statusConfig = {
    0: { name: 'Lead', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    1: { name: 'Qualificado', color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
    2: { name: 'Proposta', color: 'bg-orange-500', bgColor: 'bg-orange-50' },
    3: { name: 'Negociação', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    4: { name: 'Fechado', color: 'bg-green-500', bgColor: 'bg-green-50' }
  };

  const priorityConfig = {
    0: { name: 'Baixa', color: 'text-gray-600', bg: 'bg-gray-100' },
    1: { name: 'Média', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    2: { name: 'Alta', color: 'text-red-600', bg: 'bg-red-100' }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/deals/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = () => {
    setEditingDeal(null);
    setShowModal(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    setShowModal(true);
  };

  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm('Tem certeza que deseja deletar este negócio?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/deals/${dealId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Erro ao deletar negócio:', error);
    }
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (draggedDeal && draggedDeal.status !== newStatus) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/deals/${draggedDeal.id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          fetchDashboard();
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }
    
    setDraggedDeal(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                Funipro
              </h1>
              <p className="text-gray-600 mt-1">Gerencie seus negócios e acompanhe o progresso das vendas</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateDeal}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
              >
                <Plus size={20} />
                <span>Novo Negócio</span>
              </button>

              {user.role === 'Admin' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings size={20} />
                </button>
              )}

              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total de Negócios</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard?.totalDeals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Negócios Fechados</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard?.closedDeals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.totalValue || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Calendar className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Valor Fechado</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.closedValue || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusData = dashboard?.dealsByStatus?.find(d => d.status.toString() === status);
            const deals = statusData?.deals || [];
            
            return (
              <div
                key={status}
                className="bg-white rounded-xl shadow-sm border"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, parseInt(status))}
              >
                <div className={`${config.color} text-white p-4 rounded-t-xl`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{config.name}</h3>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {deals.length}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 min-h-[400px]">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-move"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{deal.title}</h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditDeal(deal)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {deal.company && (
                        <p className="text-gray-600 text-xs mb-1">{deal.company}</p>
                      )}
                      
                      {deal.contactName && (
                        <p className="text-gray-700 text-sm mb-2">{deal.contactName}</p>
                      )}
                      
                      <div className="flex flex-col space-y-1 mb-3">
                        {deal.email && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail size={12} className="mr-1" />
                            {deal.email}
                          </div>
                        )}
                        {deal.phone && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone size={12} className="mr-1" />
                            {deal.phone}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-600 text-sm">
                          {formatCurrency(deal.value)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${priorityConfig[deal.priority]?.bg} ${priorityConfig[deal.priority]?.color}`}>
                          {priorityConfig[deal.priority]?.name}
                        </span>
                      </div>
                      
                      {deal.expectedCloseDate && (
                        <div className="mt-2 text-xs text-gray-500">
                          Previsão: {new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <DealModalComponent
          deal={editingDeal}
          onClose={() => setShowModal(false)}
          onSave={fetchDashboard}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 mb-2">Desenvolvido por</p>
          <a 
            href="https://sysmath.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-blue-600 font-semibold hover:scale-110 transform transition-all duration-300 hover:text-purple-600"
          >
            Sysmath.com.br
          </a>
        </div>
      </footer>
    </div>
  );
}

// Componente DealModal implementado inline
function DealModalComponent({ deal, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    contactName: '',
    email: '',
    phone: '',
    value: 0,
    status: 0,
    priority: 1,
    expectedCloseDate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || '',
        company: deal.company || '',
        contactName: deal.contactName || '',
        email: deal.email || '',
        phone: deal.phone || '',
        value: deal.value || 0,
        status: deal.status || 0,
        priority: deal.priority || 1,
        expectedCloseDate: deal.expectedCloseDate ? 
          new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
        notes: deal.notes || ''
      });
    }
  }, [deal]);

  const handleSubmit = async () => {
    if (!formData.title) {
      setError('Título é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = deal 
        ? `http://localhost:5000/api/deals/${deal.id}`
        : 'http://localhost:5000/api/deals';
      
      const method = deal ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        expectedCloseDate: formData.expectedCloseDate || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar negócio');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {deal ? 'Editar Negócio' : 'Novo Negócio'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o título do negócio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Contato
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do contato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$)
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Lead</option>
                <option value={1}>Qualificado</option>
                <option value={2}>Proposta</option>
                <option value={3}>Negociação</option>
                <option value={4}>Fechado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Baixa</option>
                <option value={1}>Média</option>
                <option value={2}>Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Prevista de Fechamento
              </label>
              <input
                type="date"
                name="expectedCloseDate"
                value={formData.expectedCloseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* CAMPO DE ANOTAÇÕES */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anotações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                maxLength="2000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Digite suas anotações, comentários ou observações sobre este negócio..."
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Máximo de 2000 caracteres
                </p>
                <p className="text-xs text-gray-400">
                  {formData.notes.length}/2000
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            ) : (
              <Save size={16} />
            )}
            <span>{loading ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;