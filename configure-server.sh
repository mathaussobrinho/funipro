#!/bin/bash

# Script de configuração do servidor
# Configura Nginx, systemd service e banco de dados

set -e

echo "=========================================="
echo "Configurando servidor FuniPro"
echo "=========================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Configurar banco de dados
echo -e "${YELLOW}[1/4] Configurando banco de dados...${NC}"
cd /var/www/funipro/backend

# Criar banco de dados se não existir
echo "Criando banco de dados..."
sqlcmd -S localhost -U sa -P 'YourStrongPassword123!' -Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'FuniproDb') CREATE DATABASE FuniproDb;" || echo "Erro ao criar banco. Verifique se SQL Server está rodando e a senha está correta."

# 2. Aplicar migrations
echo -e "${YELLOW}[2/4] Aplicando migrations...${NC}"
cd /var/www/funipro/backend
dotnet ef database update --project . || echo "Erro ao aplicar migrations. Verifique a connection string."

# 3. Criar systemd service
echo -e "${YELLOW}[3/4] Criando systemd service...${NC}"
sudo tee /etc/systemd/system/funipro-api.service > /dev/null <<EOF
[Unit]
Description=FuniPro API
After=network.target mssql-server.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/funipro/backend/publish
ExecStart=/usr/local/bin/dotnet /var/www/funipro/backend/publish/FuniproApi.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=funipro-api
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable funipro-api
sudo systemctl start funipro-api

# 4. Configurar Nginx
echo -e "${YELLOW}[4/4] Configurando Nginx...${NC}"
sudo tee /etc/nginx/sites-available/funipro.shop > /dev/null <<'EOF'
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name funipro.shop www.funipro.shop;
    
    # Permitir Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name funipro.shop www.funipro.shop;

    # SSL será configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/funipro.shop/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/funipro.shop/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Logs
    access_log /var/log/nginx/funipro-access.log;
    error_log /var/log/nginx/funipro-error.log;

    # Frontend React
    root /var/www/funipro/frontend/build;
    index index.html;

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/funipro.shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

echo -e "${GREEN}=========================================="
echo "Configuração concluída!"
echo "==========================================${NC}"
echo ""
echo "Status dos serviços:"
sudo systemctl status funipro-api --no-pager -l || true
echo ""
echo "Para obter certificado SSL, execute:"
echo "sudo certbot --nginx -d funipro.shop -d www.funipro.shop --non-interactive --agree-tos --email seu-email@exemplo.com"
echo ""
echo "Depois de obter o certificado, descomente as linhas SSL no arquivo:"
echo "/etc/nginx/sites-available/funipro.shop"

