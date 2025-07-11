# MCP Portal da Transparência Brasil

[![npm version](https://badge.fury.io/js/mcp-portal-transparencia-brasil.svg)](https://badge.fury.io/js/mcp-portal-transparencia-brasil)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Um MCP Server que fornece acesso programático à API do Portal da Transparência do Governo Federal brasileiro através do protocolo MCP.

## 📋 Sobre o Projeto

Este projeto implementa um MCP Server que oferece acesso inteligente e estruturado a todos os endpoints disponíveis na API do Portal da Transparência (https://api.portaldatransparencia.gov.br/v3/api-docs). O sistema oferece:

- **Integração MCP Completa** com suporte a Claude Desktop, Cursor e outras UIs compatíveis
- **Geração Dinâmica de Ferramentas** a partir do Swagger/OpenAPI
- **Autenticação Simplificada** com suporte a API Key via variáveis de ambiente
- **Tratamento Robusto de Erros** com mensagens amigáveis em português
- **Logs Estruturados** em JSON para monitoramento
- **Suporte a NPX** para execução direta sem instalação

## 🚀 Funcionalidades

### ✅ Características Principais

- 🔄 **Geração Dinâmica de Ferramentas MCP** a partir do Swagger V3
- 🏗️ **Categorização Inteligente** de endpoints por área (servidores, contratos, etc.)
- 🔐 **Sistema de Autenticação** via variável de ambiente `PORTAL_API_KEY`
- 📊 **Logging Estruturado** com métricas detalhadas
- 🔧 **Tratamento de Erros** com mensagens amigáveis em português
- 📚 **Documentação Completa** e exemplos práticos

### 🎯 Endpoints Suportados

O MCP Server fornece acesso a todos os endpoints do Portal da Transparência, incluindo:

- **Servidores** - Dados do Poder Executivo Federal
- **Viagens** - Consultas de viagens a serviço
- **Licitações** - Informações sobre processos licitatórios
- **Contratos** - Contratos do Poder Executivo Federal
- **Despesas** - Gastos e empenhos governamentais
- **Benefícios** - Programas sociais e beneficiários
- **Sanções** - CNEP, CEIS e CEPIM
- **Convênios** - Acordos e transferências
- **Imóveis** - Imóveis funcionais
- **Emendas** - Emendas parlamentares
- **Notas Fiscais** - Documentos fiscais
- **Coronavírus** - Dados específicos da pandemia

## 🛠️ Instalação

### Uso via npx (Recomendado para MCP Server)

```bash
# Executar MCP Server diretamente (para Claude Desktop, Cursor, etc.)
npx mcp-portal-transparencia-brasil

# Ou instalar globalmente
npm install -g mcp-portal-transparencia-brasil
mcp-portal-transparencia-brasil
```

### Instalação local

```bash
# Instalar via npm
npm install mcp-portal-transparencia-brasil

# Ou via yarn
yarn add mcp-portal-transparencia-brasil
```

## ⚙️ Configuração

### Pré-requisitos

- Node.js >= 16.0
- Uma chave de API do Portal da Transparência (obrigatória)
- Cliente MCP compatível (Claude Desktop, Cursor, etc.)

### Configuração para Cursor

Adicione ao seu `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "portal-transparencia": {
      "command": "npx",
      "args": ["mcp-portal-transparencia-brasil"],
      "env": {
        "PORTAL_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

### Configuração para Claude Desktop

Adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "portal-transparencia": {
      "command": "npx",
      "args": ["mcp-portal-transparencia-brasil"],
      "env": {
        "PORTAL_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

## 🔍 Desenvolvimento com MCP Inspector

O [MCP Inspector](https://github.com/modelcontextprotocol/inspector) é uma ferramenta oficial que permite testar e desenvolver visualmente todas as ferramentas MCP em uma interface web interativa. É essencial para o desenvolvimento e debugging do projeto.

### 🚀 Como Usar o Inspector

1. **Obtenha uma API Key**:
   - Acesse: https://api.portaldatransparencia.gov.br/api-de-dados/cadastrar-email
   - Guarde sua chave para usar nos próximos passos

2. **Execute o Inspector**:

   ```bash
   # Clone o repositório
   git clone https://github.com/dutradotdev/mcp-portal-transparencia
   cd mcp-portal-transparencia

   # Instale as dependências
   npm install

   # Execute o Inspector
   npm run inspector:direct
   ```

3. **Conecte ao Inspector**:
   - Clique no link que aparece no terminal: `Open inspector with token pre-filled`
   - No navegador, com o link aberto, procure `Add Environment Variable`
   - Adicione a Key `PORTAL_API_KEY` e Value gerado no portal da transparência
   - Aperte connect

4. **Recursos do Inspector para Desenvolvimento**:
   - 🔍 **Filtros**: Encontre ferramentas específicas rapidamente
   - 📝 **Documentação**: Veja detalhes de cada ferramenta
   - 🧪 **Teste**: Execute chamadas com diferentes parâmetros
   - 🐛 **Debug**: Visualize erros e respostas detalhadas
   - 💾 **Histórico**: Mantenha registro das chamadas realizadas

### 📝 Scripts NPM Disponíveis

```bash
# Desenvolvimento
npm run dev          # Executar em modo desenvolvimento
npm run build        # Compilar TypeScript
npm run test        # Executar testes
npm run lint        # Verificar código
npm run format      # Formatar código

# MCP Inspector
npm run inspector          # Executar com arquivo de configuração
npm run inspector:direct   # Executar diretamente
```

## 🧪 Testes

```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Cobertura de testes
npm run test:coverage
```

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

Importante: Não testei esse projeto como biblioteca.
O foco era o MCP.
Use como biblioteca por sua conta e risco. (PRs são bem-vindos)

```typescript
import { PortalTransparenciaClient } from 'mcp-portal-transparencia-brasil';

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

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🔗 Links Úteis

- [Portal da Transparência](https://portaldatransparencia.gov.br/)
- [Documentação da API](https://api.portaldatransparencia.gov.br/swagger-ui/)
- [Cadastro de API Key](https://api.portaldatransparencia.gov.br/api-de-dados/cadastrar-email)
- [MCP Protocol](https://github.com/modelcontextprotocol/protocol)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
