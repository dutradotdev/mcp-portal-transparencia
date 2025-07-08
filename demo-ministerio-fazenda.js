#!/usr/bin/env node

console.log('🏛️ MCP Portal da Transparência - Ferramentas para Ministério da Fazenda');
console.log('='.repeat(80));
console.log('');

console.log('📊 SERVIDOR MCP CARREGADO COM 106 FERRAMENTAS');
console.log('');

console.log('🔑 Ferramentas principais para dados da Fazenda:');
console.log('');

const ferramentas = [
  {
    name: 'portal_check_api_key',
    description:
      '⚠️ VERIFICAR API KEY - Verifica se a API key do Portal da Transparência está configurada',
    exemplo: '{}',
    categoria: '🔧 Sistema',
  },
  {
    name: 'portal_servidores_consultar',
    description: 'Consultar servidores do Poder Executivo Federal por órgão',
    exemplo: '{ "orgaoServidorLotacao": "26000", "pagina": 1 }',
    categoria: '👥 Servidores',
  },
  {
    name: 'portal_despesas_consultar',
    description: 'Consultar despesas públicas por órgão e período',
    exemplo: '{ "codigoOrgao": "26000", "mesAno": "202401", "pagina": 1 }',
    categoria: '💰 Despesas',
  },
  {
    name: 'portal_contratos_consultar',
    description: 'Consultar contratos do Poder Executivo Federal',
    exemplo: '{ "codigoOrgao": "26000", "dataInicial": "01/01/2024", "dataFinal": "31/12/2024" }',
    categoria: '📋 Contratos',
  },
  {
    name: 'portal_licitacoes_consultar',
    description: 'Consultar licitações do Poder Executivo Federal',
    exemplo: '{ "codigoOrgao": "26000", "dataInicial": "01/01/2024", "dataFinal": "31/12/2024" }',
    categoria: '🏗️ Licitações',
  },
  {
    name: 'portal_viagens_consultar',
    description: 'Consultar viagens a serviço por órgão e período',
    exemplo: '{ "codigoOrgao": "26000", "dataIdaDe": "01/01/2024", "dataIdaAte": "31/01/2024" }',
    categoria: '✈️ Viagens',
  },
];

ferramentas.forEach((tool, index) => {
  console.log(`${index + 1}. ${tool.categoria} ${tool.name}`);
  console.log(`   📝 ${tool.description}`);
  console.log(`   💡 Exemplo: ${tool.exemplo}`);
  console.log('');
});

console.log('🏛️ CÓDIGO DO MINISTÉRIO DA FAZENDA: 26000');
console.log('');

console.log('📌 COMO USAR:');
console.log('1. Configure sua API key: PORTAL_API_KEY=sua_chave_aqui');
console.log('2. Execute: npm run inspector');
console.log('3. Ou use em Claude Desktop/Cursor com a configuração MCP');
console.log('');

console.log('🌐 OBTER API KEY GRATUITA:');
console.log('https://api.portaldatransparencia.gov.br/api-de-dados');
console.log('');

console.log('🔗 CONFIGURAÇÃO PARA CLAUDE DESKTOP:');
console.log('Adicione ao seu claude_desktop_config.json:');
console.log(`{
  "mcpServers": {
    "portal-transparencia": {
      "command": "npx",
      "args": ["mcp-portal-transparencia"],
      "env": {
        "PORTAL_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}`);
console.log('');

console.log('⚡ EXECUTAR INSPECTOR AGORA:');
console.log('npm run inspector');
