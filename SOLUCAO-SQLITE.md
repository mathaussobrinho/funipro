# ✅ Problema Resolvido - SQLite Configurado

## O que foi feito:

1. **Adicionado SQLite** ao projeto (não requer instalação de SQL Server)
2. **Configurado `appsettings.json`** para usar SQLite: `Data Source=funipro.db`
3. **Ajustado `Program.cs`** para detectar automaticamente SQLite ou SQL Server
4. **Banco de dados será criado automaticamente** na primeira execução

## Como usar:

### Rodar o Backend:
```powershell
cd backend
dotnet run
```

O banco SQLite será criado automaticamente como `funipro.db` na pasta `backend/`.


## Usuário Admin Padrão:

- **Email:** `mathaus@admin`
- **Senha:** `mathaus@123`

## Arquivo do Banco:

O arquivo `funipro.db` será criado automaticamente na pasta `backend/` na primeira execução.

## Vantagens do SQLite:

✅ Não precisa instalar nada  
✅ Banco é um único arquivo  
✅ Funciona perfeitamente para desenvolvimento  
✅ Pode copiar/mover o arquivo facilmente  



