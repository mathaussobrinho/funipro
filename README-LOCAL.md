# Como Rodar Localmente - FuniPro

## Pré-requisitos

1. **.NET 8 SDK** instalado
2. **Node.js 18+** instalado

**Não precisa instalar SQL Server!** O projeto usa SQLite localmente.

## Passo a Passo

### 1. Iniciar Backend

```powershell
cd backend
dotnet restore
dotnet run
```

O backend iniciará em `http://localhost:5000` e `https://localhost:5001`

**O banco SQLite será criado automaticamente** na primeira execução como `funipro.db` na pasta `backend/`

**Credenciais padrão criadas:**
- Email: `mathaus@admin`
- Senha: `mathaus@123`

### 2. Iniciar Frontend

```powershell
cd frontend
npm install
npm start
```

O frontend iniciará em `http://localhost:3000` e se conectará automaticamente à API local.

### 3. Acessar

- Frontend: http://localhost:3000
- API Swagger: https://localhost:5001/swagger (se estiver em Development mode)
- API diretamente: http://localhost:5000/api

## Configuração do Banco

O projeto usa **SQLite** localmente:
- Arquivo: `backend/funipro.db` (criado automaticamente)
- Não precisa instalar nada

## Resetar Banco (se necessário)

Para começar do zero, simplesmente delete o arquivo `backend/funipro.db` e rode o backend novamente.

## Troubleshooting

### Erro: "Cannot open database"
- Certifique-se de que o backend está rodando
- Verifique se o arquivo `funipro.db` foi criado na pasta `backend/`

### Erro: "CORS"
- O CORS já está configurado para `http://localhost:3000`
- Certifique-se de que o frontend está rodando na porta 3000

### Erro ao criar usuário
- A senha `mathaus@123` já está configurada para ser aceita (sem requisitos especiais)
- Se ainda der erro, verifique os logs no console do backend
