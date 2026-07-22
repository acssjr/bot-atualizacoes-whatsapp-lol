import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { handleCommand } from '../commands/handler.js';
import { startCronService } from './cronService.js';
import { updateWebStatus, updateWebQr, broadcastStateUpdate } from '../server.js';

const CONFIG_FILE = path.resolve('config.json');

export function extractMessageText(msg) {
  if (!msg || !msg.message) return '';

  // Suporte a Mensagens Temporárias (Ephemeral), Mídias com Legenda e Respostas
  const m = msg.message.ephemeralMessage?.message || msg.message;

  return m.conversation || 
         m.extendedTextMessage?.text || 
         m.imageMessage?.caption || 
         m.videoMessage?.caption || 
         m.documentMessage?.caption || 
         '';
}

export async function updateAllowedGroups(sock, groupJid) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (!config.allowedGroups) config.allowedGroups = [];
    if (!config.groupNames) config.groupNames = {};

    let nameUpdated = false;

    if (!config.allowedGroups.includes(groupJid)) {
      config.allowedGroups.push(groupJid);
      nameUpdated = true;
    }

    // Tenta buscar o nome/assunto do grupo no WhatsApp
    try {
      if (sock && (!config.groupNames[groupJid] || config.groupNames[groupJid] === 'Grupo WhatsApp')) {
        const metadata = await sock.groupMetadata(groupJid);
        if (metadata && metadata.subject) {
          config.groupNames[groupJid] = metadata.subject;
          nameUpdated = true;
        }
      }
    } catch (err) {
      // Ignora falha de metadata se o grupo for privado/restrito
    }

    if (nameUpdated) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log(`[WhatsApp] Grupo autorizado/atualizado no dashboard: ${config.groupNames[groupJid] || groupJid}`);
      broadcastStateUpdate();
    }
  } catch (err) {
    console.error('[WhatsApp] Erro ao salvar grupo no config:', err.message);
  }
}

export async function syncParticipatingGroups(sock) {
  try {
    const participatingGroups = await sock.groupFetchAllParticipating();
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (!config.allowedGroups) config.allowedGroups = [];
    if (!config.groupNames) config.groupNames = {};

    let updated = false;

    for (const [gJid, gMeta] of Object.entries(participatingGroups)) {
      if (!config.allowedGroups.includes(gJid)) {
        config.allowedGroups.push(gJid);
        updated = true;
      }
      if (gMeta && gMeta.subject && config.groupNames[gJid] !== gMeta.subject) {
        config.groupNames[gJid] = gMeta.subject;
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log(`[WhatsApp] Sincronizados ${Object.keys(participatingGroups).length} grupos participantes no dashboard.`);
      broadcastStateUpdate();
    }
  } catch (err) {
    console.error('[WhatsApp] Erro ao sincronizar grupos participantes:', err.message);
  }
}

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  console.log(`[WhatsApp] Versão do Baileys: v${version.join('.')}`);

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n==================================================');
      console.log('📱 NOVO QR CODE DISPONÍVEL NO DASHBOARD WEB');
      console.log('==================================================\n');
      
      qrcode.generate(qr, { small: true });
      await updateWebQr(qr);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = (statusCode !== DisconnectReason.loggedOut);
      
      updateWebStatus(false, `Desconectado (Código: ${statusCode || 'Desconhecido'})`);
      console.log(`[WhatsApp] Conexão fechada. Reconectando em 5s:`, shouldReconnect);
      
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 5000);
      }
    } else if (connection === 'open') {
      console.log('\n==================================================');
      console.log('✅ BOT DO WHATSAPP CONECTADO COM SUCESSO!');
      console.log('==================================================\n');
      
      updateWebStatus(true, 'Conectado ao WhatsApp');
      startCronService(sock);

      // Sincroniza automaticamente todos os grupos onde o bot está presente
      setTimeout(() => syncParticipatingGroups(sock), 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      const text = extractMessageText(msg).trim();

      if (remoteJid.endsWith('@g.us')) {
        await updateAllowedGroups(sock, remoteJid);
      }

      if (text.startsWith('!')) {
        console.log(`[Comando Recebido] de ${remoteJid}: "${text}"`);
        try {
          await handleCommand(text, sock, remoteJid);
        } catch (err) {
          console.error(`[WhatsApp] Erro ao processar comando "${text}":`, err.message);
        }
      }
    }
  });

  return sock;
}
