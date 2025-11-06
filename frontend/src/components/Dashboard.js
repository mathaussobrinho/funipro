import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Phone, Mail, X, Save, Archive } from 'lucide-react';
import { API_URL } from '../config';

function Dashboard({ user, onLogout, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [subLocations, setSubLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDeal, setViewingDeal] = useState(null);
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
    fetchSubLocations();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deals/dashboard`, {
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

  const fetchSubLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sublocation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubLocations(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar sublocações:', error);
    }
  };


  // Calcular valores totais
  const calculateTotalValues = () => {
    // Valor total de negócios fechados (gross value)
    const closedDeals = dashboard?.dealsByStatus?.find(d => d.status === 4)?.deals || [];
    const totalFromClosedDeals = closedDeals.reduce((sum, deal) => {
      const grossValue = deal.grossValue > 0 ? deal.grossValue : deal.value;
      return sum + grossValue;
    }, 0);

    // Valor total bruto de sublocações (service value)
    const totalSubLocationGross = subLocations.reduce((sum, sub) => sum + (sub.serviceValue || 0), 0);
    
    // Valor total líquido de sublocações (já descontado)
    const totalFromSubLocations = subLocations.reduce((sum, sub) => sum + (sub.netValue || 0), 0);

    // Valor total bruto (fechados + sublocação bruta)
    const valorTotal = totalFromClosedDeals + totalSubLocationGross;

    // Total de descontos da sublocação
    const totalDiscounts = subLocations.reduce((sum, sub) => sum + (sub.discountValue || 0), 0);

    // Valor líquido (total bruto - descontos da sublocação)
    const valorLiquido = valorTotal - totalDiscounts;

    return {
      valorTotal,
      valorLiquido,
      totalFromClosedDeals,
      totalFromSubLocations,
      totalDiscounts
    };
  };

  const handleCreateDeal = () => {
    setEditingDeal(null);
    setShowModal(true);
  };

  const handleViewDeal = (deal, e) => {
    // Prevenir que o clique no card abra o modal se clicou em um botão
    if (e.target.closest('button')) {
      return;
    }
    setViewingDeal(deal);
    setShowViewModal(true);
  };

  const handleEditDeal = (deal, e) => {
    if (e) e.stopPropagation(); // Prevenir que o clique no botão abra o modal de visualização
    setEditingDeal(deal);
    setShowModal(true);
  };

  const handleArchiveDeal = async (id) => {
    if (window.confirm('Tem certeza que deseja arquivar este negócio?\n\nNegócios arquivados não aparecerão nos relatórios e valores.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/deals/${id}/archive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          fetchDashboard();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Erro ao arquivar negócio');
        }
      } catch (error) {
        console.error('Erro ao arquivar negócio:', error);
        alert('Erro ao arquivar negócio');
      }
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm('Tem certeza que deseja deletar este negócio?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deals/${dealId}`, {
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
        const response = await fetch(`${API_URL}/deals/${draggedDeal.id}/status`, {
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

  // Função para calcular o tamanho da fonte baseado no comprimento do texto
  const getFontSize = (value) => {
    const formatted = formatCurrency(value);
    const length = formatted.length;
    
    // Ajustar o tamanho baseado no comprimento - valores menores para garantir que caiba tudo
    if (length <= 10) {
      return '1.125rem'; // 18px
    } else if (length <= 12) {
      return '1rem'; // 16px
    } else if (length <= 15) {
      return '0.875rem'; // 14px
    } else if (length <= 18) {
      return '0.75rem'; // 12px
    } else {
      return '0.625rem'; // 10px
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Verificar se é aniversário em 2 dias
  const isBirthdaySoon = (birthday) => {
    if (!birthday) return false;
    const today = new Date();
    const bday = new Date(birthday);
    bday.setFullYear(today.getFullYear());
    const diffDays = Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header simplificado */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Funil de Vendas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie seus negócios e acompanhe o progresso</p>
          </div>
          <button
            onClick={handleCreateDeal}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
          >
            <Plus size={20} />
            <span>Novo Negócio</span>
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusData = dashboard?.dealsByStatus?.find(d => d.status.toString() === status);
            const deals = statusData?.deals || [];
            const isFechadoColumn = parseInt(status) === 4;
            
            if (isFechadoColumn) {
              // Para Fechado: dividir em 2 partes (coluna + painel de valores)
              const values = calculateTotalValues();
              return (
                <React.Fragment key={status}>
                  {/* Coluna Fechado */}
                  <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, parseInt(status))}
                    style={{ minHeight: '600px' }}
                  >
                    <div className={`${config.color} text-white p-4 rounded-t-xl`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{config.name}</h3>
                        <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                          {deals.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3 flex-1">
                      {deals.map((deal) => {
                        const birthdaySoon = isBirthdaySoon(deal.birthday);
                        return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal)}
                          onClick={(e) => handleViewDeal(deal, e)}
                          className={`bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                            birthdaySoon ? 'ring-2 ring-pink-400 ring-opacity-75 shadow-lg animate-pulse' : ''
                          }`}
                          style={birthdaySoon ? {
                            boxShadow: '0 0 20px rgba(244, 114, 182, 0.5), 0 0 40px rgba(244, 114, 182, 0.3)'
                          } : {}}
                        >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{deal.title}</h4>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => handleEditDeal(deal, e)}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveDeal(deal.id);
                              }}
                              className="text-gray-400 hover:text-yellow-600 p-1"
                              title="Arquivar"
                            >
                              <Archive size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDeal(deal.id);
                              }}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Deletar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {deal.company && (
                          <p className="text-gray-600 dark:text-white text-xs mb-1">{deal.company}</p>
                        )}
                        
                        {deal.contactName && (
                          <p className="text-gray-700 dark:text-white text-sm mb-2">{deal.contactName}</p>
                        )}
                        
                        <div className="flex flex-col space-y-1 mb-3">
                          {deal.email && (
                            <div className="flex items-center text-xs text-gray-600 dark:text-white">
                              <Mail size={12} className="mr-1 text-gray-600 dark:text-white" />
                              {deal.email}
                            </div>
                          )}
                          {deal.phone && (
                            <div className="flex items-center text-xs text-gray-600 dark:text-white">
                              <Phone size={12} className="mr-1 text-gray-600 dark:text-white" />
                              {deal.phone}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                            {formatCurrency(deal.value)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${priorityConfig[deal.priority]?.bg} ${priorityConfig[deal.priority]?.color}`}>
                            {priorityConfig[deal.priority]?.name}
                          </span>
                        </div>
                        
                        {deal.paymentMethod !== null && deal.paymentMethod !== undefined && (
                          <div className="mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              deal.paymentMethod === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                              deal.paymentMethod === 1 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                              'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                            }`}>
                              {deal.paymentMethod === 0 ? '💳 Cartão' :
                               deal.paymentMethod === 1 ? '💸 PIX' :
                               deal.paymentMethod === 2 ? '📄 Boleto' : '💵 Dinheiro'}
                            </span>
                          </div>
                        )}
                        
                        {deal.birthday && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-white">
                            🎂 {new Date(deal.birthday).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        
                        {deal.expectedCloseDate && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-white">
                            Previsão: {new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    );
                    })}
                    </div>
                  </div>

                  {/* Painel de Valores */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex flex-col" style={{ minHeight: '600px' }}>
                    <div className="sticky top-4 space-y-4">
                      {/* Valor Total */}
                      <div className="bg-white dark:bg-gray-700 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase">Valor Total</h4>
                        <div className="w-full flex items-center justify-center px-3 py-2">
                          <div className="font-bold text-green-600 dark:text-green-400" style={{ 
                            fontSize: getFontSize(values.valorTotal),
                            whiteSpace: 'nowrap',
                            overflow: 'visible'
                          }}>
                            {formatCurrency(values.valorTotal)}
                          </div>
                        </div>
                      </div>

                      {/* Valor Líquido */}
                      <div className="bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase">Valor Líquido</h4>
                        <div className="w-full flex items-center justify-center px-3 py-2">
                          <div className="font-bold text-blue-600 dark:text-blue-400" style={{ 
                            fontSize: getFontSize(values.valorLiquido),
                            whiteSpace: 'nowrap',
                            overflow: 'visible'
                          }}>
                            {formatCurrency(values.valorLiquido)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            }
            
            // Para as outras colunas normais
            return (
              <div
                key={status}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, parseInt(status))}
                style={{ minHeight: '600px' }}
              >
                <div className={`${config.color} text-white p-4 rounded-t-xl`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{config.name}</h3>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {deals.length}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 flex-1">
                  {deals.map((deal) => {
                    const birthdaySoon = isBirthdaySoon(deal.birthday);
                    return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onClick={(e) => handleViewDeal(deal, e)}
                      className={`bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        birthdaySoon ? 'ring-2 ring-pink-400 ring-opacity-75 shadow-lg animate-pulse' : ''
                      }`}
                      style={birthdaySoon ? {
                        boxShadow: '0 0 20px rgba(244, 114, 182, 0.5), 0 0 40px rgba(244, 114, 182, 0.3)'
                      } : {}}
                    >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{deal.title}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => handleEditDeal(deal, e)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleArchiveDeal(deal.id)}
                          className="text-gray-400 hover:text-yellow-600 p-1"
                          title="Arquivar"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Deletar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {deal.company && (
                      <p className="text-gray-600 dark:text-white text-xs mb-1">{deal.company}</p>
                    )}
                    
                    {deal.contactName && (
                      <p className="text-gray-700 dark:text-white text-sm mb-2">{deal.contactName}</p>
                    )}
                    
                    <div className="flex flex-col space-y-1 mb-3">
                      {deal.email && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-white">
                          <Mail size={12} className="mr-1 text-gray-600 dark:text-white" />
                          {deal.email}
                        </div>
                      )}
                      {deal.phone && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-white">
                          <Phone size={12} className="mr-1 text-gray-600 dark:text-white" />
                          {deal.phone}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                        {formatCurrency(deal.value)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${priorityConfig[deal.priority]?.bg} ${priorityConfig[deal.priority]?.color}`}>
                        {priorityConfig[deal.priority]?.name}
                      </span>
                    </div>
                    
                    {deal.paymentMethod !== null && deal.paymentMethod !== undefined && (
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          deal.paymentMethod === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          deal.paymentMethod === 1 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          {deal.paymentMethod === 0 ? '💳 Cartão' :
                           deal.paymentMethod === 1 ? '💸 PIX' :
                           deal.paymentMethod === 2 ? '📄 Boleto' : '💵 Dinheiro'}
                        </span>
                      </div>
                    )}
                    
                    {deal.birthday && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-white">
                        🎂 {new Date(deal.birthday).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    
                    {deal.expectedCloseDate && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-white">
                        Previsão: {new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                );
                })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Visualização */}
      {showViewModal && viewingDeal && (
        <DealViewModal
          deal={viewingDeal}
          onClose={() => {
            setShowViewModal(false);
            setViewingDeal(null);
          }}
          onEdit={(deal) => {
            setShowViewModal(false);
            setViewingDeal(null);
            setEditingDeal(deal);
            setShowModal(true);
          }}
        />
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <DealModalComponent
          deal={editingDeal}
          onClose={() => setShowModal(false)}
          onSave={fetchDashboard}
        />
      )}

    </div>
  );
}

// Componente DealViewModal para visualizar detalhes
function DealViewModal({ deal, onClose, onEdit }) {
  const statusConfig = {
    0: { name: 'Lead', color: 'bg-blue-500' },
    1: { name: 'Qualificado', color: 'bg-yellow-500' },
    2: { name: 'Proposta', color: 'bg-orange-500' },
    3: { name: 'Negociação', color: 'bg-purple-500' },
    4: { name: 'Fechado', color: 'bg-green-500' }
  };

  const priorityConfig = {
    0: { name: 'Baixa', color: 'text-gray-600', bg: 'bg-gray-100' },
    1: { name: 'Média', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    2: { name: 'Alta', color: 'text-red-600', bg: 'bg-red-100' }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Detalhes do Negócio
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Título e Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{deal.title}</h3>
              <div className="flex items-center space-x-2">
                <span className={`${statusConfig[deal.status]?.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                  {statusConfig[deal.status]?.name}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig[deal.priority]?.bg} ${priorityConfig[deal.priority]?.color}`}>
                  Prioridade: {priorityConfig[deal.priority]?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Valor */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor do Negócio</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(deal.value)}
            </p>
            {deal.grossValue > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Valor Bruto: {formatCurrency(deal.grossValue)}
              </p>
            )}
            {deal.netValue > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Valor Líquido: {formatCurrency(deal.netValue)}
              </p>
            )}
          </div>

          {/* Informações da Empresa e Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deal.company && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Empresa</p>
                <p className="text-base text-gray-900 dark:text-white">{deal.company}</p>
              </div>
            )}
            {deal.contactName && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nome do Contato</p>
                <p className="text-base text-gray-900 dark:text-white">{deal.contactName}</p>
              </div>
            )}
          </div>

          {/* Contato */}
          {(deal.email || deal.phone) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contato</p>
              <div className="space-y-2">
                {deal.email && (
                  <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Mail size={18} className="text-gray-500 dark:text-gray-400" />
                    <a href={`mailto:${deal.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {deal.email}
                    </a>
                  </div>
                )}
                {deal.phone && (
                  <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                    <Phone size={18} className="text-gray-500 dark:text-gray-400" />
                    <a href={`tel:${deal.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {deal.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Método de Pagamento */}
          {deal.paymentMethod !== null && deal.paymentMethod !== undefined && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Método de Pagamento</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                deal.paymentMethod === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                deal.paymentMethod === 1 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {deal.paymentMethod === 0 ? '💳 Cartão' :
                 deal.paymentMethod === 1 ? '💸 PIX' :
                 deal.paymentMethod === 2 ? '📄 Boleto' : '💵 Dinheiro'}
              </span>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deal.birthday && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">🎂 Aniversário</p>
                <p className="text-base text-gray-900 dark:text-white">{formatDate(deal.birthday)}</p>
              </div>
            )}
            {deal.expectedCloseDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Data Prevista de Fechamento</p>
                <p className="text-base text-gray-900 dark:text-white">{formatDate(deal.expectedCloseDate)}</p>
              </div>
            )}
            {deal.paymentDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Data de Pagamento</p>
                <p className="text-base text-gray-900 dark:text-white">{formatDate(deal.paymentDate)}</p>
              </div>
            )}
          </div>

          {/* Anotações */}
          {deal.notes && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Anotações</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border dark:border-gray-600">
                <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">{deal.notes}</p>
              </div>
            </div>
          )}

          {/* Informações do Sistema */}
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Criado em</p>
                <p className="text-gray-900 dark:text-white">{formatDate(deal.createdAt)}</p>
              </div>
              {deal.updatedAt && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Atualizado em</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(deal.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => onEdit(deal)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit size={16} />
            <span>Editar</span>
          </button>
        </div>
      </div>
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
    paymentMethod: null,
    expectedCloseDate: '',
    paymentDate: '',
    birthday: '',
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
        paymentMethod: deal.paymentMethod !== null && deal.paymentMethod !== undefined ? deal.paymentMethod : null,
        expectedCloseDate: deal.expectedCloseDate ? 
          new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
        paymentDate: deal.paymentDate ? 
          new Date(deal.paymentDate).toISOString().split('T')[0] : '',
        birthday: deal.birthday ? 
          new Date(deal.birthday).toISOString().split('T')[0] : '',
        notes: deal.notes || ''
      });
    } else {
      setFormData({
        title: '',
        company: '',
        contactName: '',
        email: '',
        phone: '',
        value: 0,
        status: 0,
        priority: 1,
        paymentMethod: null,
        expectedCloseDate: '',
        paymentDate: '',
        birthday: '',
        notes: ''
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
        ? `${API_URL}/deals/${deal.id}`
        : `${API_URL}/deals`;
      
      const method = deal ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        status: parseInt(formData.status) || 0,
        priority: parseInt(formData.priority) || 1,
        expectedCloseDate: formData.expectedCloseDate || null,
        paymentDate: formData.paymentDate || null,
        birthday: formData.birthday || null,
        paymentMethod: formData.paymentMethod !== null && formData.paymentMethod !== '' ? parseInt(formData.paymentMethod) : null
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
        const savedData = await response.json();
        console.log('Negócio salvo com sucesso:', savedData);
        onClose();
        // Recarregar dashboard imediatamente
        onSave();
      } else {
        let errorMessage = 'Erro ao salvar negócio';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            errorMessage = 'Erro ao processar resposta do servidor';
          }
        } else {
          try {
            const errorText = await response.text();
            if (errorText) {
              try {
                const errorObj = JSON.parse(errorText);
                errorMessage = errorObj.message || errorObj.error || errorMessage;
              } catch {
                errorMessage = errorText.substring(0, 200) || errorMessage;
              }
            }
          } catch (textError) {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao salvar negócio:', error);
      setError(error.message || 'Erro desconhecido ao salvar negócio');
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
                Método de Pagamento
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod !== null && formData.paymentMethod !== undefined ? formData.paymentMethod : ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value={0}>💳 Cartão</option>
                <option value={1}>💸 PIX</option>
                <option value={2}>📄 Boleto</option>
                <option value={3}>💵 Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Aniversário
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Pagamento
              </label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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