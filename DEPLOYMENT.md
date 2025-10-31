# Guia de Deployment - FuniPro

Este guia explica como fazer o deployment da aplicação FuniPro no servidor Ubuntu.

## Pré-requisitos

- Servidor Ubuntu 20.04 ou superior
- Acesso SSH como root ou usuário com sudo
- Domínio apontando para o IP do servidor (funipro.shop)

## Passo a Passo

### 1. Conectar ao Servidor

```bash
ssh root@72.61.36.102
```

### 2. Clonar o Repositório

```bash
cd /var/www
git clone https://github.com/mathaussobrinho/funipro.git
cd funipro
```

### 3. Executar Script de Instalação

```bash
chmod +x deploy.sh
./deploy.sh
```

O script irá:
- Atualizar o sistema
- Instalar .NET 8 SDK
- Instalar Node.js 18.x
- Instalar SQL Server
- Instalar Nginx
- Instalar Certbot
- Fazer build do backend e frontend

### 4. Configurar SQL Server

Durante a instalação, você precisará configurar a senha do SA do SQL Server. Execute:

```bash
sudo /opt/mssql/bin/mssql-conf setup
```

**Importante:** Anote a senha que você configurar. Você precisará atualizar o arquivo `appsettings.Production.json`.

### 5. Atualizar Configurações de Produção

Edite o arquivo `backend/appsettings.Production.json` e atualize a connection string com a senha correta do SQL Server:

```bash
nano backend/appsettings.Production.json
```

Atualize a linha:
```json
"DefaultConnection": "Server=localhost;Database=FuniproDb;User Id=sa;Password=SUA_SENHA_AQUI;Encrypt=False;TrustServerCertificate=True;MultipleActiveResultSets=true;"
```

### 6. Configurar o Servidor

Execute o script de configuração:

```bash
chmod +x configure-server.sh
sudo ./configure-server.sh
```

Este script irá:
- Criar o banco de dados
- Aplicar migrations
- Configurar o serviço systemd
- Configurar Nginx

### 7. Obter Certificado SSL

Para habilitar HTTPS, obtenha um certificado Let's Encrypt:

```bash
sudo certbot --nginx -d funipro.shop -d www.funipro.shop --non-interactive --agree-tos -m seu-email@exemplo.com
```

O Certbot irá automaticamente configurar o Nginx com SSL.

### 8. Verificar Status dos Serviços

```bash
# Status da API
sudo systemctl status funipro-api

# Status do Nginx
sudo systemctl status nginx

# Status do SQL Server
sudo systemctl status mssql-server
```

### 9. Ver Logs

```bash
# Logs da API
sudo journalctl -u funipro-api -f

# Logs do Nginx
sudo tail -f /var/log/nginx/funipro-access.log
sudo tail -f /var/log/nginx/funipro-error.log
```

## Usuário Default

Após o primeiro deploy, o sistema criará automaticamente um usuário administrador:

- **Email:** mathaus@admin
- **Senha:** mathaus@123

## Comandos Úteis

### Reiniciar Serviços

```bash
sudo systemctl restart funipro-api
sudo systemctl restart nginx
sudo systemctl restart mssql-server
```

### Atualizar Aplicação

```bash
cd /var/www/funipro
git pull origin main

# Rebuild backend
cd backend
dotnet publish -c Release -o /var/www/funipro/backend/publish
sudo systemctl restart funipro-api

# Rebuild frontend
cd ../frontend
npm install
npm run build
sudo cp -r build/* /var/www/funipro/frontend/build/
sudo systemctl reload nginx
```

### Verificar Portas

```bash
sudo netstat -tlnp | grep :5000  # Backend API
sudo netstat -tlnp | grep :80    # Nginx HTTP
sudo netstat -tlnp | grep :443   # Nginx HTTPS
```

## Troubleshooting

### Erro de conexão com SQL Server

1. Verifique se o SQL Server está rodando:
   ```bash
   sudo systemctl status mssql-server
   ```

2. Teste a conexão:
   ```bash
   sqlcmd -S localhost -U sa -P 'sua-senha'
   ```

3. Verifique se a porta 1433 está aberta:
   ```bash
   sudo ufw allow 1433/tcp
   ```

### API não responde

1. Verifique os logs:
   ```bash
   sudo journalctl -u funipro-api -n 50
   ```

2. Verifique se o serviço está rodando:
   ```bash
   sudo systemctl status funipro-api
   ```

3. Teste a API diretamente:
   ```bash
   curl http://localhost:5000/api/health
   ```

### Nginx retorna 502 Bad Gateway

1. Verifique se a API está rodando na porta 5000
2. Verifique as configurações de proxy no Nginx
3. Verifique os logs do Nginx: `sudo tail -f /var/log/nginx/funipro-error.log`

## Estrutura de Diretórios

```
/var/www/funipro/
├── backend/
│   ├── publish/          # Build do backend (.NET)
│   └── ...
├── frontend/
│   ├── build/            # Build do frontend (React)
│   └── ...
└── ...
```

## Segurança

- Mantenha o sistema atualizado: `sudo apt-get update && sudo apt-get upgrade`
- Configure firewall adequadamente
- Mantenha senhas seguras no `appsettings.Production.json`
- Configure backup automático do banco de dados

## Suporte

Em caso de problemas, verifique:
1. Logs dos serviços
2. Configurações de firewall
3. Status dos serviços systemd
4. Configurações do Nginx

