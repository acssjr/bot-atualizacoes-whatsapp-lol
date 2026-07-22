import { startWebServer } from './server.js';
import { connectToWhatsApp } from './services/whatsapp.js';

console.log('🚀 Iniciando Bot do WhatsApp (LoL & TFT) com Dashboard Web...');

// 1. Inicia o servidor Web Dashboard na porta 3000
startWebServer();

// 2. Conecta a instância do WhatsApp (Baileys)
connectToWhatsApp().catch(err => {
  console.error('❌ Erro fatal ao iniciar a conexão do WhatsApp:', err);
});
