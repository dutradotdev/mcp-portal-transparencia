# MCP Inspector - Portal da Transparência

Este guia mostra como usar o [MCP Inspector](https://github.com/modelcontextprotocol/inspector) para testar visualmente as ferramentas do Portal da Transparência.

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

- Node.js >= 18.0.0
- API Key do Portal da Transparência ([obter aqui](https://api.portaldatransparencia.gov.br/api-de-dados))

<<<<<<< HEAD

### 2. Build do projeto

=======

### 2. Configurar API Key

```bash
# Criar arquivo .env
echo "PORTAL_API_KEY=sua_api_key_aqui" > .env
```

### 3. Build do projeto

> > > > > > > develop

```bash
npm run build
```

## 🔍 Usando o MCP Inspector

### Método 1: Via NPX (Recomendado)

```bash
<<<<<<< HEAD
# Executar inspector
npx @modelcontextprotocol/inspector node dist/src/mcp-server.js
```

### Como Conectar ao Inspector

1. Clique no link que aparece no terminal: `Open inspector with token pre-filled`

2. No navegador, com o link aberto, procure `Add Environment Variable`

3. Adicione a Key `PORTAL_API_KEY` e Value gerado no portal da transparência

4. Aperte `Connect`

=======

# Executar inspector diretamente

PORTAL_API_KEY=sua_api_key_aqui npx @modelcontextprotocol/inspector node dist/src/mcp-server.js

````

>>>>>>> develop
### Método 2: Via configuração

```bash
# Usar arquivo de configuração (já criado)
npm run inspector
````

### Método 3: Modo direto

```bash
# Execução direta com variável de ambiente
npm run inspector:direct
```

## 🏛️ Testando Dados do Ministério da Fazenda

### Código do Órgão

- **Ministério da Fazenda**: `26000`

### Ferramentas Principais

#### 1. Verificar API Key

```json
{
  "name": "portal_check_api_key",
  "arguments": {}
}
```

#### 2. Consultar Servidores da Fazenda

```json
{
  "name": "portal_servidores_consultar",
  "arguments": {
    "orgaoServidorLotacao": "26000",
    "pagina": 1
  }
}
```

<<<<<<< HEAD

#### 2. Consultar Despesas da Fazenda

=======

#### 3. Consultar Despesas da Fazenda

> > > > > > > develop

```json
{
  "name": "portal_despesas_consultar",
  "arguments": {
    "codigoOrgao": "26000",
    "mesAno": "202401",
    "pagina": 1
  }
}
```

<<<<<<< HEAD

#### 3. Consultar Contratos da Fazenda

=======

#### 4. Consultar Contratos da Fazenda

> > > > > > > develop

```json
{
  "name": "portal_contratos_consultar",
  "arguments": {
    "codigoOrgao": "26000",
    "dataInicial": "01/01/2024",
    "dataFinal": "31/12/2024"
  }
}
```

<<<<<<< HEAD

#### 4. Consultar Licitações da Fazenda

=======

#### 5. Consultar Licitações da Fazenda

> > > > > > > develop

```json
{
  "name": "portal_licitacoes_consultar",
  "arguments": {
    "codigoOrgao": "26000",
    "dataInicial": "01/01/2024",
    "dataFinal": "31/12/2024"
  }
}
```

<<<<<<< HEAD

#### 5. Consultar Viagens a Serviço da Fazenda

=======

#### 6. Consultar Viagens a Serviço da Fazenda

> > > > > > > develop

```json
{
  "name": "portal_viagens_consultar",
  "arguments": {
    "codigoOrgao": "26000",
    "dataIdaDe": "01/01/2024",
    "dataIdaAte": "31/01/2024"
  }
}
```

## 📊 Interface do Inspector

O MCP Inspector fornece uma interface web onde você pode:

1. **Ver todas as 106 ferramentas** disponíveis
2. **Testar ferramentas individuais** com parâmetros personalizados
3. **Ver respostas em tempo real** da API do Portal da Transparência
4. **Debugar problemas** de conectividade e autenticação

## 🐛 Troubleshooting

### Inspector não abre interface web

- Verifique se o Node.js é versão 18+
- Tente matar processos anteriores: `pkill -f inspector`

### Erro de API Key

- Verifique se a variável `PORTAL_API_KEY` está configurada
- Obtenha uma API key válida no Portal da Transparência

### Servidor MCP não inicia

- Execute `npm run build` primeiro
- Verifique logs em `npm run mcp-server`

## 🎯 Demonstração Rápida

```bash
# Ver ferramentas disponíveis
npm run demo

# Executar inspector
npm run inspector:direct
```

## 📝 Scripts Disponíveis

- `npm run demo` - Mostra ferramentas disponíveis
- `npm run inspector` - Inspector com configuração
- `npm run inspector:direct` - Inspector direto
- `npm run mcp-server` - Apenas o servidor MCP

## 🔗 Links Úteis

- [Portal da Transparência](https://portaldatransparencia.gov.br/)
- [API do Portal](https://api.portaldatransparencia.gov.br/)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Documentação MCP](https://modelcontextprotocol.io/)
