# MCP Portal da Transparência

[![npm version](https://badge.fury.io/js/mcp-portal-transparencia.svg)](https://badge.fury.io/js/mcp-portal-transparencia)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Um Multi-step Call Planner (MCP) para orquestração de chamadas à API do Portal da Transparência do Governo Federal brasileiro.

## 📋 Sobre o Projeto

Este projeto implementa um MCP (Multi-step Call Planner) que automatiza e orquestra chamadas para todos os endpoints disponíveis na API do Portal da Transparência (https://api.portaldatransparencia.gov.br/v3/api-docs). O sistema oferece:

- **Geração automática de clientes TypeScript** a partir do Swagger/OpenAPI
- **Orquestração inteligente** de múltiplas chamadas de API
- **Tratamento robusto de erros** e rate limiting
- **Logs estruturados** em JSON para monitoramento
- **Autenticação centralizada** com suporte a API Key

## 🚀 Funcionalidades

### ✅ Características Principais

- 🔄 **Importação automática** do spec Swagger V3
- 🏗️ **Geração de clientes TypeScript** para cada endpoint
- 🔐 **Sistema de autenticação** com API Key e variáveis de ambiente
- ⚡ **Rate limiting inteligente** com alertas (90/min diurno, 300/min noturno)
- 📊 **Logging estruturado** com métricas de sucesso/falha
- 🔧 **Tratamento de erros** categorizado (4xx vs 5xx)
- 📚 **Documentação completa** e exemplos de uso

### 🎯 Endpoints Suportados

- **Viagens a Serviço** - Consultas de viagens de servidores públicos
- **Servidores** - Dados do Poder Executivo Federal
- **Licitações** - Informações sobre processos licitatórios
- **Contratos** - Contratos do Poder Executivo Federal
- **Despesas Públicas** - Gastos e empenhos governamentais
- **Benefícios** - Programas sociais e benefícios
- **Sanções** - CNEP, CEIS e CEPIM
- **Convênios** - Acordos e transferências
- **E muito mais...** (veja a documentação completa)

## 🛠️ Instalação

### Uso via npx (Recomendado para MCP Server)

```bash
# Executar MCP Server diretamente (para Claude Desktop, Cursor, etc.)
npx mcp-portal-transparencia

# Ou instalar globalmente
npm install -g mcp-portal-transparencia
mcp-portal-transparencia
```

### Instalação local

```bash
# Instalar via npm
npm install mcp-portal-transparencia

# Ou via yarn
yarn add mcp-portal-transparencia
```

## ⚙️ Configuração

### Pré-requisitos

- Node.js >= 16.0
- Uma chave de API do Portal da Transparência (obrigatória para MCP Server)

### Variáveis de Ambiente

Para usar o MCP Server, configure as variáveis de ambiente:

```env
# API Key do Portal da Transparência (obrigatória)
PORTAL_API_KEY=sua_api_key_aqui

# Configurações opcionais
LOG_LEVEL=info
```

### Configuração para Claude Desktop

Adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "portal-transparencia": {
      "command": "npx",
      "args": ["mcp-portal-transparencia"],
      "env": {
        "PORTAL_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

### Configuração para Cursor

Adicione ao seu `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "portal-transparencia": {
      "command": "npx",
      "args": ["mcp-portal-transparencia"],
      "env": {
        "PORTAL_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

## 🔍 MCP Inspector - Teste Local e Visual

O [MCP Inspector](https://github.com/modelcontextprotocol/inspector) é uma ferramenta oficial da Anthropic que permite testar visualmente todas as ferramentas MCP em uma interface web interativa. É perfeito para desenvolvimento e debugging.

### 🚀 Como Usar o Inspector

#### 1. Pré-requisitos

```bash
# Obter uma API key gratuita
# Acesse: https://api.portaldatransparencia.gov.br/api-de-dados/cadastrar-email
```

#### 2. Configuração Rápida

```bash
# 1. Clone ou baixe este projeto
git clone https://github.com/seu-usuario/mcp-portal-transparencia.git
cd mcp-portal-transparencia

# 2. Configure sua API key
echo "PORTAL_API_KEY=sua_api_key_aqui" > .env

# 3. Faça o build do projeto
npm run build

# 4. Execute o MCP Inspector
PORTAL_API_KEY=sua_api_key_aqui npx @modelcontextprotocol/inspector node dist/src/mcp-server.js
```

#### 3. Acesso à Interface

Após executar o comando acima, você verá uma saída similar a:

```
🔗 Open inspector with token pre-filled:
   http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=seu_token_aqui

🔍 MCP Inspector is up and running at http://127.0.0.1:6274 🚀
```

**Clique no link** que aparece no terminal para acessar o inspector com autenticação automática!

#### 4. Interface Visual

No MCP Inspector você pode:

- ✅ **Ver todas as 106+ ferramentas** geradas automaticamente
- 🔧 **Testar qualquer ferramenta** com parâmetros personalizados
- 📊 **Visualizar respostas** em JSON formatado
- 🔍 **Filtrar ferramentas** por categoria ou nome
- 📖 **Ver documentação** de cada ferramenta

#### 5. Exemplo de Teste - Ministério da Fazenda

1. **Verificar API Key**:
   - Ferramenta: `portal_check_api_key`
   - Parâmetros: `{}` (vazio)

2. **Consultar Servidores da Fazenda**:
   - Ferramenta: `portal_servidores_consultar`
   - Parâmetros:
     ```json
     {
       "orgaoServidorLotacao": "26000",
       "pagina": 1
     }
     ```

3. **Buscar Despesas da Fazenda**:
   - Ferramenta: `portal_despesas_consultar`
   - Parâmetros:
     ```json
     {
       "codigoOrgao": "26000",
       "mesAno": 202412,
       "pagina": 1
     }
     ```

### 📝 Scripts NPM Adicionais

Para facilitar o uso, você pode usar os scripts npm:

```bash
# Executar o inspector diretamente
npm run inspector:direct

# Executar com arquivo de configuração
npm run inspector

# Ver demonstração das ferramentas
npm run demo
```

### 🐛 Resolução de Problemas

**Problema**: Erro 401 "Chave de API não informada"

```bash
# Solução: Verificar se a API key está configurada
echo $PORTAL_API_KEY  # Deve mostrar sua chave

# Ou reconfigurar
export PORTAL_API_KEY=sua_chave_aqui
```

**Problema**: Erro de conexão no inspector

```bash
# Solução: Verificar se o build foi feito
npm run build

# E tentar novamente
PORTAL_API_KEY=sua_chave_aqui npx @modelcontextprotocol/inspector node dist/src/mcp-server.js
```

**Problema**: Porta ocupada

```bash
# Solução: Matar processos na porta
pkill -f inspector
# E tentar novamente
```

### 💡 Dicas do Inspector

- 🎯 **Filtros**: Use `portal_ministerio_fazenda` para ver apenas ferramentas da Fazenda
- 📊 **Favoritos**: Salve combinações de parâmetros usadas frequentemente
- 🔄 **Re-execução**: Use `Ctrl+Enter` para re-executar rapidamente
- 📋 **Copiar**: Clique em qualquer resposta para copiar o JSON
- 🌓 **Modo Escuro**: Disponível no menu de configurações

## 📖 Uso via MCP (Recomendado)

O MCP Server permite usar o Portal da Transparência diretamente através de ferramentas como Claude Desktop, Cursor, e outras interfaces compatíveis com MCP.

### Ferramentas Disponíveis

Após configurar o MCP Server, você terá acesso a todas as ferramentas geradas automaticamente:

- `portal_check_api_key` - Verificar se a API key está configurada
- `portal_servidores_*` - Consultar dados de servidores públicos
- `portal_viagens_*` - Consultar viagens a serviço
- `portal_contratos_*` - Consultar contratos públicos
- `portal_despesas_*` - Consultar despesas públicas
- `portal_beneficios_*` - Consultar programas sociais
- E muitas outras...

### Exemplos de Uso no Claude

```
🔍 Consultar servidores do Ministério da Fazenda
🎯 Buscar contratos acima de R$ 1 milhão
📊 Analisar despesas por órgão no último trimestre
🏛️ Verificar benefícios sociais por região
```

## 📖 Uso Programático (Biblioteca)

```typescript
import { PortalTransparenciaClient } from 'mcp-portal-transparencia';

// Inicializar o cliente
const client = new PortalTransparenciaClient({
  apiKey: process.env.PORTAL_API_KEY,
  enableRateLimitAlerts: true,
  logLevel: 'info',
});

// Exemplo: Consultar viagens por período
const viagens = await client.viagens.consultar({
  dataIdaDe: '01/01/2024',
  dataIdaAte: '31/01/2024',
  dataRetornoDe: '01/01/2024',
  dataRetornoAte: '31/01/2024',
  codigoOrgao: '26000',
  pagina: 1,
});

// Exemplo: Consultar servidores
const servidores = await client.servidores.consultar({
  orgaoServidorLotacao: '26000',
  pagina: 1,
});

// Exemplo: Buscar licitações
const licitacoes = await client.licitacoes.consultar({
  dataInicial: '01/01/2024',
  dataFinal: '31/01/2024',
  codigoOrgao: '26000',
  pagina: 1,
});
```

## 🔧 Funcionalidades Avançadas

### Rate Limiting e Alertas

O sistema monitora automaticamente o rate limiting da API:

```typescript
// O cliente alerta automaticamente quando atingir 80% do limite
// Limites: 90 req/min (06:00-23:59) | 300 req/min (00:00-05:59)

client.on('rateLimitWarning', info => {
  console.log(`Aviso: ${info.percentage}% do rate limit atingido`);
});

client.on('rateLimitExceeded', error => {
  console.error('Rate limit excedido:', error.message);
});
```

### Orquestração de Múltiplas Chamadas

```typescript
// Exemplo de busca correlacionada
const resultado = await client
  .orchestrator()
  .addStep('orgaos', () => client.orgaos.listarSiafi({ pagina: 1 }))
  .addStep('servidores', prev =>
    client.servidores.consultar({
      orgaoServidorLotacao: prev.orgaos[0].codigo,
      pagina: 1,
    })
  )
  .addStep('remuneracoes', prev =>
    client.servidores.consultarRemuneracao({
      cpf: prev.servidores[0].cpf,
      mesAno: 202401,
      pagina: 1,
    })
  )
  .execute();
```

### Logs Estruturados

```typescript
// Logs automáticos em JSON
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "endpoint": "/api-de-dados/viagens",
  "method": "GET",
  "statusCode": 200,
  "responseTime": 245,
  "rateLimitRemaining": 85,
  "correlationId": "abc123"
}
```

## 📚 Documentação

### Estrutura do Projeto

```
mcp-portal-transparencia/
├── src/
│   ├── clients/          # Clientes para cada endpoint
│   ├── core/            # Classes principais (Orchestrator, Auth)
│   ├── types/           # Interfaces TypeScript geradas
│   ├── utils/           # Utilitários (logging, rate limiting)
│   └── index.ts         # Ponto de entrada principal
├── docs/                # Documentação detalhada
├── examples/            # Exemplos de uso
└── tests/               # Testes unitários e integração
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Executar em modo desenvolvimento
npm run build        # Compilar TypeScript
npm run test         # Executar testes
npm run test:watch   # Testes em modo watch
npm run lint         # Verificar código com ESLint
npm run format       # Formatar código com Prettier

# Documentação
npm run docs:build   # Gerar documentação
npm run docs:serve   # Servir documentação localmente
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes de integração (requer API key)
npm run test:integration
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🔗 Links Úteis

- [Portal da Transparência](https://portaldatransparencia.gov.br/)
- [API Documentation](https://api.portaldatransparencia.gov.br/swagger-ui/index.html)
- [Swagger JSON](https://api.portaldatransparencia.gov.br/v3/api-docs)
- [Decreto nº 8.777/2016](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8777.htm)

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/mcp-portal-transparencia/issues)
- **Email**: listaapitransparencia@cgu.gov.br (CGU)
- **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/mcp-portal-transparencia/wiki)

---

**Desenvolvido com ❤️ para promover a transparência pública no Brasil**
