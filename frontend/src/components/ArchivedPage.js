import React, { useState, useEffect, useMemo } from 'react';
import { Archive, RotateCcw, Search, Filter, Calendar } from 'lucide-react';
import { API_URL } from '../config';

function ArchivedPage({ user, onLogout, onNavigate }) {
  const [archivedDeals, setArchivedDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchArchivedDeals();
  }, []);

  const fetchArchivedDeals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deals/archived`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Deals arquivados carregados:', data);
        setArchivedDeals(data || []);
      } else {
        console.error('Erro ao carregar arquivados:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (id) => {
    if (window.confirm('Tem certeza que deseja desarquivar este negócio?\n\nEle voltará a aparecer no funil e será contabilizado nos relatórios.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/deals/${id}/unarchive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          fetchArchivedDeals();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Erro ao desarquivar negócio');
        }
      } catch (error) {
        console.error('Erro ao desarquivar negócio:', error);
        alert('Erro ao desarquivar negócio');
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statusConfig = {
    0: { name: 'Lead', color: 'bg-blue-100 text-blue-600' },
    1: { name: 'Qualificado', color: 'bg-yellow-100 text-yellow-600' },
    2: { name: 'Proposta', color: 'bg-orange-100 text-orange-600' },
    3: { name: 'Negociação', color: 'bg-purple-100 text-purple-600' },
    4: { name: 'Fechado', color: 'bg-green-100 text-green-600' }
  };

  // Filtrar e ordenar deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = [...archivedDeals];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (filterStatus !== '') {
      filtered = filtered.filter(deal => deal.status.toString() === filterStatus);
    }

    // Ordenar por data de arquivamento (mais recente primeiro)
    filtered.sort((a, b) => {
      const dateA = a.archivedAt ? new Date(a.archivedAt) : new Date(a.updatedAt);
      const dateB = b.archivedAt ? new Date(b.archivedAt) : new Date(b.updatedAt);
      return dateB - dateA;
    });

    return filtered;
  }, [archivedDeals, searchTerm, filterStatus]);

  // Agrupar por data
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredAndSortedDeals.forEach(deal => {
      const date = deal.archivedAt || deal.updatedAt;
      const dateStr = new Date(date).toLocaleDateString('pt-BR');
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(deal);
    });
    return groups;
  }, [filteredAndSortedDeals]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
            Negócios Arquivados
          </h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie negócios arquivados</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por título, empresa, contato ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Todos os status</option>
                <option value="0">Lead</option>
                <option value="1">Qualificado</option>
                <option value="2">Proposta</option>
                <option value="3">Negociação</option>
                <option value="4">Fechado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista agrupada por data */}
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Archive size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {archivedDeals.length === 0 
                ? 'Nenhum negócio arquivado ainda' 
                : 'Nenhum negócio encontrado com os filtros aplicados'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, deals]) => (
              <div key={date} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} className="text-gray-500" />
                    <h3 className="font-semibold text-gray-700">{date}</h3>
                    <span className="text-sm text-gray-500">({deals.length} {deals.length === 1 ? 'negócio' : 'negócios'})</span>
                  </div>
                </div>
                <div className="divide-y">
                  {deals.map((deal) => (
                    <div key={deal.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${statusConfig[deal.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                              {statusConfig[deal.status]?.name || 'Desconhecido'}
                            </span>
                          </div>
                          
                          {deal.company && (
                            <p className="text-sm text-gray-600 mb-1">Empresa: {deal.company}</p>
                          )}
                          
                          {deal.contactName && (
                            <p className="text-sm text-gray-700 mb-1">Contato: {deal.contactName}</p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {deal.email && (
                              <span>{deal.email}</span>
                            )}
                            {deal.phone && (
                              <span>{deal.phone}</span>
                            )}
                            <span className="font-semibold text-green-600">
                              {formatCurrency(deal.value)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <button
                            onClick={() => handleUnarchive(deal.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                            title="Desarquivar"
                          >
                            <RotateCcw size={16} />
                            <span>Voltar ao Funil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArchivedPage;

