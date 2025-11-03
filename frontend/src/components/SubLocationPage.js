import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { API_URL } from '../config';

function SubLocationPage({ user, onLogout, onNavigate }) {
  const [subLocations, setSubLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchSubLocations();
  }, []);

  const fetchSubLocations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sublocation`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sublocações carregadas:', data);
        setSubLocations(data || []);
      } else {
        console.error('Erro ao carregar sublocações:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Resposta do servidor:', errorText);
      }
    } catch (error) {
      console.error('Erro ao carregar sublocação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este registro?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/sublocation/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSubLocations();
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Sublocação
            </h1>
            <p className="text-gray-600 mt-1">Controle de serviços por terceiros</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Registro</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terceiro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desconto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Líquido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subLocations.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500">{item.description}</div>
                      )}
                      {item.serviceType && (
                        <div className="text-xs text-gray-400 mt-1">{item.serviceType}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.thirdPartyName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(item.serviceValue)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.discountPercentage.toFixed(2)}% ({formatCurrency(item.discountValue)})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">{formatCurrency(item.netValue)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(item.serviceDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subLocations.length === 0 && (
            <div className="p-12 text-center">
              <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum registro cadastrado ainda</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <SubLocationModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={fetchSubLocations}
        />
      )}
    </div>
  );
}

function SubLocationModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thirdPartyName: '',
    serviceValue: 0,
    discountPercentage: 0,
    serviceType: '',
    serviceDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        thirdPartyName: item.thirdPartyName || '',
        serviceValue: item.serviceValue || 0,
        discountPercentage: item.discountPercentage || 0,
        serviceType: item.serviceType || '',
        serviceDate: item.serviceDate ? new Date(item.serviceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [item]);

  const calculateValues = () => {
    const serviceValue = parseFloat(formData.serviceValue) || 0;
    const discountPercentage = parseFloat(formData.discountPercentage) || 0;
    const discountValue = serviceValue * (discountPercentage / 100);
    const netValue = serviceValue - discountValue;
    return { discountValue, netValue };
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      setError('Título é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = item ? `${API_URL}/sublocation/${item.id}` : `${API_URL}/sublocation`;
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          serviceValue: parseFloat(formData.serviceValue) || 0,
          discountPercentage: parseFloat(formData.discountPercentage) || 0,
          serviceDate: formData.serviceDate || new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('Sublocação salva com sucesso:', savedData);
        onClose();
        // Recarregar lista imediatamente
        onSave();
      } else {
        let errorMessage = 'Erro ao salvar sublocação';
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
      console.error('Erro ao salvar sublocação:', error);
      setError(error.message || 'Erro desconhecido ao salvar sublocação');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const { discountValue, netValue } = calculateValues();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Editar Registro' : 'Novo Registro'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
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
                placeholder="Digite o nome do serviço"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Terceiro
              </label>
              <input
                type="text"
                name="thirdPartyName"
                value={formData.thirdPartyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do prestador de serviço"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço
              </label>
              <input
                type="text"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Limpeza, Manutenção, etc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Serviço (R$)
              </label>
              <input
                type="number"
                name="serviceValue"
                value={formData.serviceValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentual de Desconto (%)
              </label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor do Desconto:</span>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(discountValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor Líquido:</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(netValue)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Serviço
              </label>
              <input
                type="date"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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

export default SubLocationPage;