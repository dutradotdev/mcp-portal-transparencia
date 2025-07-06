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

```bash
# Instalar via npm
npm install mcp-portal-transparencia

# Ou via yarn
yarn add mcp-portal-transparencia
```

## ⚙️ Configuração

### Pré-requisitos

- Node.js >= 16.0
- Uma chave de API do Portal da Transparência (opcional para endpoints públicos)

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do seu projeto:

```env
# API Key do Portal da Transparência (se necessário)
PORTAL_TRANSPARENCIA_API_KEY=sua_api_key_aqui

# Configurações opcionais
LOG_LEVEL=info
RATE_LIMIT_ALERTS=true
```

## 📖 Uso Básico

```typescript
import { PortalTransparenciaClient } from "mcp-portal-transparencia";

// Inicializar o cliente
const client = new PortalTransparenciaClient({
  apiKey: process.env.PORTAL_TRANSPARENCIA_API_KEY, // opcional
  enableRateLimitAlerts: true,
  logLevel: "info",
});

// Exemplo: Consultar viagens por período
const viagens = await client.viagens.consultar({
  dataIdaDe: "01/01/2024",
  dataIdaAte: "31/01/2024",
  dataRetornoDe: "01/01/2024",
  dataRetornoAte: "31/01/2024",
  codigoOrgao: "26000",
  pagina: 1,
});

// Exemplo: Consultar servidores
const servidores = await client.servidores.consultar({
  orgaoServidorLotacao: "26000",
  pagina: 1,
});

// Exemplo: Buscar licitações
const licitacoes = await client.licitacoes.consultar({
  dataInicial: "01/01/2024",
  dataFinal: "31/01/2024",
  codigoOrgao: "26000",
  pagina: 1,
});
```

## 🔧 Funcionalidades Avançadas

### Rate Limiting e Alertas

O sistema monitora automaticamente o rate limiting da API:

```typescript
// O cliente alerta automaticamente quando atingir 80% do limite
// Limites: 90 req/min (06:00-23:59) | 300 req/min (00:00-05:59)

client.on("rateLimitWarning", (info) => {
  console.log(`Aviso: ${info.percentage}% do rate limit atingido`);
});

client.on("rateLimitExceeded", (error) => {
  console.error("Rate limit excedido:", error.message);
});
```

### Orquestração de Múltiplas Chamadas

```typescript
// Exemplo de busca correlacionada
const resultado = await client
  .orchestrator()
  .addStep("orgaos", () => client.orgaos.listarSiafi({ pagina: 1 }))
  .addStep("servidores", (prev) =>
    client.servidores.consultar({
      orgaoServidorLotacao: prev.orgaos[0].codigo,
      pagina: 1,
    })
  )
  .addStep("remuneracoes", (prev) =>
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
