#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

// Configurar ambiente
process.env.LOG_LEVEL = 'info';

class MCPTester {
  constructor() {
    this.mcpProcess = null;
  }

  async startMCPServer() {
    console.log('🚀 Iniciando servidor MCP do Portal da Transparência...\n');

    this.mcpProcess = spawn('node', ['dist/src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    // Aguardar inicialização
    await setTimeout(3000);

    return new Promise((resolve, reject) => {
      let output = '';

      this.mcpProcess.stdout.on('data', data => {
        output += data.toString();
        console.log('📊 Saída do servidor:', data.toString().trim());
      });

      this.mcpProcess.stderr.on('data', data => {
        console.log('⚠️ Logs do servidor:', data.toString().trim());
      });

      this.mcpProcess.on('error', error => {
        console.error('❌ Erro no servidor:', error);
        reject(error);
      });

      // Simular teste das ferramentas
      setTimeout(() => {
        console.log('\n📋 Ferramentas disponíveis para o Ministério da Fazenda:');
        console.log('='.repeat(60));

        const ferramentasFazenda = [
          {
            name: 'portal_check_api_key',
            description: 'Verificar se a API key está configurada',
            categoria: 'Sistema',
          },
          {
            name: 'portal_servidores_consultar',
            description: 'Consultar servidores do Poder Executivo',
            categoria: 'Servidores',
          },
          {
            name: 'portal_despesas_consultar',
            description: 'Consultar despesas públicas',
            categoria: 'Despesas',
          },
          {
            name: 'portal_contratos_consultar',
            description: 'Consultar contratos públicos',
            categoria: 'Contratos',
          },
          {
            name: 'portal_licitacoes_consultar',
            description: 'Consultar licitações',
            categoria: 'Licitações',
          },
          {
            name: 'portal_viagens_consultar',
            description: 'Consultar viagens a serviço',
            categoria: 'Viagens',
          },
        ];

        ferramentasFazenda.forEach((tool, index) => {
          console.log(`${index + 1}. ${tool.name}`);
          console.log(`   📝 ${tool.description}`);
          console.log(`   🏷️ Categoria: ${tool.categoria}`);
          console.log('');
        });

        console.log('\n🏛️ Exemplos de consultas para o Ministério da Fazenda:');
        console.log('='.repeat(60));

        console.log('💰 1. Consultar servidores da Fazenda:');
        console.log('   Código do órgão: 26000 (Ministério da Fazenda)');
        console.log('   portal_servidores_consultar({ orgaoServidorLotacao: "26000" })');
        console.log('');

        console.log('💸 2. Consultar despesas da Fazenda:');
        console.log('   portal_despesas_consultar({ codigoOrgao: "26000", ano: "2024" })');
        console.log('');

        console.log('📋 3. Consultar contratos da Fazenda:');
        console.log('   portal_contratos_consultar({ codigoOrgao: "26000" })');
        console.log('');

        console.log('✈️ 4. Consultar viagens a serviço da Fazenda:');
        console.log('   portal_viagens_consultar({ codigoOrgao: "26000" })');
        console.log('');

        console.log('📌 IMPORTANTE:');
        console.log('   Para usar essas ferramentas, você precisa:');
        console.log(
          '   1. Obter uma API key em: https://api.portaldatransparencia.gov.br/api-de-dados'
        );
        console.log('   2. Configurar PORTAL_API_KEY na variável de ambiente');
        console.log('   3. Usar um cliente MCP compatível (Claude Desktop, Cursor, etc.)');
        console.log('');

        resolve();
      }, 5000);
    });
  }

  async stop() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      console.log('\n✅ Servidor MCP finalizado');
    }
  }
}

// Executar teste
async function main() {
  const tester = new MCPTester();

  try {
    await tester.startMCPServer();
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await tester.stop();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
