#!/bin/bash

# Script de deployment para Ubuntu Server
# Este script instala todas as dependências e configura a aplicação FuniPro

set -e

echo "=========================================="
echo "Iniciando deployment do FuniPro"
echo "=========================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Atualizar sistema
echo -e "${YELLOW}[1/10] Atualizando sistema...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Instalar dependências básicas
echo -e "${YELLOW}[2/10] Instalando dependências básicas...${NC}"
sudo apt-get install -y curl wget git build-essential software-properties-common

# Instalar .NET 8 SDK e Runtime
echo -e "${YELLOW}[3/10] Instalando .NET 8...${NC}"
if ! command -v dotnet &> /dev/null; then
    wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
    sudo chmod +x dotnet-install.sh
    ./dotnet-install.sh --channel 8.0
    sudo ln -s $HOME/.dotnet/dotnet /usr/local/bin/dotnet
    rm dotnet-install.sh
else
    echo ".NET já está instalado"
fi

# Instalar Node.js 18.x
echo -e "${YELLOW}[4/10] Instalando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js já está instalado"
fi

# Instalar SQL Server (mssql-server)
echo -e "${YELLOW}[5/10] Instalando SQL Server...${NC}"
if ! command -v sqlcmd &> /dev/null; then
    # Adicionar repositório Microsoft
    curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
    curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/mssql-server-2019.list | sudo tee /etc/apt/sources.list.d/mssql-server.list
    
    sudo apt-get update
    sudo apt-get install -y mssql-server
    
    # Configurar SQL Server
    echo -e "${YELLOW}Configurando SQL Server...${NC}"
    echo "IMPORTANTE: Você precisa configurar a senha do SA."
    echo "Execute o seguinte comando após a instalação:"
    echo "sudo /opt/mssql/bin/mssql-conf setup"
    echo ""
    echo "A senha padrão sugerida é: YourStrongPassword123!"
    echo ""
    echo "Aguardando 5 segundos antes de continuar..."
    sleep 5
    
    # Instalar SQL Server command-line tools
    curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
    sudo apt-get update
    sudo apt-get install -y mssql-tools unixodbc-dev
    echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
    export PATH="$PATH:/opt/mssql-tools/bin"
    
    echo ""
    echo -e "${YELLOW}ATENÇÃO: Configure o SQL Server agora executando:${NC}"
    echo "sudo /opt/mssql/bin/mssql-conf setup"
    echo "Escolha a edição (2 = Developer é gratuito)"
    echo "Aceite a licença (Yes)"
    echo "Defina a senha do SA (sugestão: YourStrongPassword123!)"
    echo ""
    read -p "Pressione Enter após configurar o SQL Server..."
    
    # Iniciar SQL Server
    sudo systemctl start mssql-server
    sudo systemctl enable mssql-server
    sleep 5  # Aguardar SQL Server iniciar
else
    echo "SQL Server já está instalado"
fi

# Instalar Nginx
echo -e "${YELLOW}[6/10] Instalando Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "Nginx já está instalado"
fi

# Instalar Certbot para SSL
echo -e "${YELLOW}[7/10] Instalando Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
else
    echo "Certbot já está instalado"
fi

# Criar diretórios
echo -e "${YELLOW}[8/10] Criando diretórios...${NC}"
sudo mkdir -p /var/www/funipro
sudo mkdir -p /var/www/funipro/backend
sudo mkdir -p /var/www/funipro/frontend
sudo chown -R $USER:$USER /var/www/funipro

# Clonar/pull do repositório
echo -e "${YELLOW}[9/10] Clonando repositório...${NC}"
if [ -d "/var/www/funipro/.git" ]; then
    cd /var/www/funipro
    git pull origin main
else
    cd /var/www
    rm -rf funipro
    git clone https://github.com/mathaussobrinho/funipro.git
fi

# Build do backend
echo -e "${YELLOW}[10/10] Buildando aplicação...${NC}"
cd /var/www/funipro/backend
dotnet restore
dotnet build -c Release
dotnet publish -c Release -o /var/www/funipro/backend/publish

# Build do frontend
cd /var/www/funipro/frontend
npm install
npm run build

# Copiar arquivos buildados
sudo cp -r build/* /var/www/funipro/frontend/build/

echo -e "${GREEN}=========================================="
echo "Deployment concluído com sucesso!"
echo "==========================================${NC}"
echo ""
echo "Próximos passos:"
echo "1. Configure a senha do SQL Server se ainda não fez:"
echo "   sudo /opt/mssql/bin/mssql-conf setup"
echo ""
echo "2. Atualize o appsettings.Production.json com a senha correta do SQL Server"
echo ""
echo "3. Execute o script de configuração:"
echo "   sudo ./configure-server.sh"
echo ""
echo "4. Para obter certificado SSL:"
echo "   sudo certbot --nginx -d funipro.shop -d www.funipro.shop"

