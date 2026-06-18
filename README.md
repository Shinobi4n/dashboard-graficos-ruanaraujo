# Dashboard de Vendas (Livraria)

Projeto simples de dashboard que consome uma classe `Vendas` no Back4App (Parse Server) e API de Clima (Meteo).

Funcionalidades
- Listagem de vendas
- Criação, edição e exclusão (CRUD)
- Gráfico agregando vendas por categoria
- Alternar visualização entre gráfico de barras e pizza

Arquivos importantes
- `index.html` — interface do dashboard
- `app.js` — lógica cliente (fetch, CRUD, gráfico)
- `config.example.js` — exemplo de configuração com chaves de API (copiar para `config.js`)

Configuração
1. Copie `config.example.js` para `config.js` e preencha `APP_ID` e `REST_KEY` com suas chaves do Back4App.

2. Sirva a pasta em um servidor local (ou abra `index.html` diretamente). 

3. Abra o projeto no navegador.

Segurança
- Nunca commite `config.js` com chaves reais — o repositório já inclui `.gitignore` com `config.js`.
