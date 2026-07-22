import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fetchRiotNews, fetchTftNews } from './riotScraper.js';
import { fetchFullPatchSummary } from '../utils/patchFormatter.js';

const CONFIG_FILE = path.resolve('config.json');
const STATE_FILE = path.resolve('state.json');

let activeSocket = null;

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return { allowedGroups: [], autoNotifyGroups: true };
  }
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { sentArticles: [] };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('[Cron] Erro ao salvar estado:', err.message);
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function checkAndSendUpdates() {
  const config = loadConfig();
  if (!config.autoNotifyGroups || !config.allowedGroups || config.allowedGroups.length === 0) {
    return 'Nenhum grupo cadastrado ou envio automático desativado.';
  }

  if (!activeSocket) {
    return 'WhatsApp não conectado no momento.';
  }

  console.log('[Cron] Verificando notas de atualização oficiais (LoL & TFT)...');
  const state = loadState();
  const sentSet = new Set(state.sentArticles || []);
  let sentCount = 0;

  // 1. Notícias Oficiais do LoL
  const lolArticles = await fetchRiotNews();
  for (const article of lolArticles) {
    if (!sentSet.has(article.id)) {
      const patchData = await fetchFullPatchSummary(article.url);

      for (const groupJid of config.allowedGroups) {
        try {
          if (patchData.imageUrl) {
            await activeSocket.sendMessage(groupJid, {
              image: { url: patchData.imageUrl },
              caption: patchData.formattedMessage
            });
          } else {
            await activeSocket.sendMessage(groupJid, { text: patchData.formattedMessage });
          }
          sentCount++;
          await delay(3000);
        } catch (err) {
          console.error(`[Cron] Erro ao enviar para grupo ${groupJid}:`, err.message);
        }
      }

      sentSet.add(article.id);
    }
  }

  // 2. Notícias Oficiais do TFT
  const tftArticles = await fetchTftNews();
  for (const article of tftArticles) {
    if (!sentSet.has(article.id)) {
      const tftData = await fetchFullPatchSummary(article.url);

      for (const groupJid of config.allowedGroups) {
        try {
          if (tftData.imageUrl) {
            await activeSocket.sendMessage(groupJid, {
              image: { url: tftData.imageUrl },
              caption: tftData.formattedMessage
            });
          } else {
            await activeSocket.sendMessage(groupJid, { text: tftData.formattedMessage });
          }
          sentCount++;
          await delay(3000);
        } catch (err) {
          console.error(`[Cron] Erro ao enviar TFT para grupo ${groupJid}:`, err.message);
        }
      }

      sentSet.add(article.id);
    }
  }

  state.sentArticles = Array.from(sentSet);
  saveState(state);

  return `Verificação concluída. Total de ${sentCount} mensagens enviadas aos grupos.`;
}

export function startCronService(sock) {
  activeSocket = sock;
  console.log('[Cron] Monitoramento iniciado (Oficial LoL, TFT e ARAM Desordem).');

  cron.schedule('*/30 * * * *', async () => {
    try {
      await checkAndSendUpdates();
    } catch (err) {
      console.error('[Cron] Erro no job de atualização:', err.message);
    }
  });
}

export function startCronJob(sock) {
  return startCronService(sock);
}

export async function runManualCronCheck() {
  return await checkAndSendUpdates();
}
