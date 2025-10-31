// Configuração da API
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

const API_BASE_URL = process.env.REACT_APP_API_URL || (() => {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  // Produção no domínio funipro.shop: API em subdomínio api.funipro.shop
  if (hostname.endsWith('funipro.shop')) {
    return 'https://api.funipro.shop';
  }
  // Fallback: mesma origem
  return typeof window !== 'undefined' ? window.location.origin : '';
})();

export const API_URL = `${API_BASE_URL}/api`;

