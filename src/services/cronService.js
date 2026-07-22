import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fetchRiotNews, fetchTftNews, fetchValorantNews, fetchMtgNews } from './riotScraper.js';
import { fetchFullPatchSummary, fetchValorantPatchSummary, fetchMtgPatchSummary } from '../utils/patchFormatter.js';

const CONFIG_FILE = path.resolve('config.json');
const STATE_FILE = path.resolve('state.json');

let activeSocket = null;

function normalizeUrl(url = '') {
  return url.trim().replace(/\/$/, '').toLowerCase();
}

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return { allowedGroups: [], autoNotifyGroups: true };
  }
}

function loadState() {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    if (!data.sentArticles) data.sentArticles = [];
    data.sentArticles = data.sentArticles.map(normalizeUrl);
    return data;
  } catch {
    return { sentArticles: [] };
  }
}

function saveState(state) {
  try {
    state.sentArticles = Array.from(new Set(state.sentArticles.map(normalizeUrl)));
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('[Cron] Erro ao salvar estado:', err.message);
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Inicializa o cache de matérias enviadas para evitar disparos de patches antigos ao subir o bot.
 */
export async function seedInitialArticles() {
  try {
    const state = loadState();
    const sentSet = new Set(state.sentArticles || []);
    let newSeeds = 0;

    const lolArticles = await fetchRiotNews();
    const tftArticles = await fetchTftNews();
    const valArticles = await fetchValorantNews();
    const mtgArticles = await fetchMtgNews();

    [...lolArticles, ...tftArticles, ...valArticles, ...mtgArticles].forEach(article => {
      const normId = normalizeUrl(article.url || article.id);
      if (normId && !sentSet.has(normId)) {
        sentSet.add(normId);
        newSeeds++;
      }
    });

    if (newSeeds > 0) {
      state.sentArticles = Array.from(sentSet);
      saveState(state);
      console.log(`[Cron] Cache inicial populado com ${newSeeds} matérias existentes. Nenhuma mensagem repetida será enviada.`);
    }
  } catch (err) {
    console.error('[Cron] Erro ao popular cache inicial:', err.message);
  }
}

/**
 * Dispara uma notificação de transmissão sobre novas adições aos grupos autorizados.
 */
export async function broadcastNewFeatureNotice(featureDescription) {
  const config = loadConfig();
  if (!config.allowedGroups || config.allowedGroups.length === 0 || !activeSocket) return;

  const notice = `🎉 *NOVA FUNCIONALIDADE ADICIONADA!* 🎉\n\n` +
                 `• *${featureDescription}* *(Beta — Pode conter bugs)*\n\n` +
                 `📌 Digite *!ajuda* a qualquer momento para conferir todos os comandos ativos!`;

  for (const groupJid of config.allowedGroups) {
    try {
      await activeSocket.sendMessage(groupJid, { text: notice });
      await delay(2000);
    } catch (e) {}
  }
}

export async function checkAndSendUpdates() {
  const config = loadConfig();
  if (!config.autoNotifyGroups || !config.allowedGroups || config.allowedGroups.length === 0) {
    return 'Nenhum grupo cadastrado ou envio automático desativado.';
  }

  if (!activeSocket) {
    return 'WhatsApp não conectado no momento.';
  }

  console.log('[Cron] Verificando novas matérias oficiais (LoL, TFT, Valorant e MTG Arena)...');
  const state = loadState();
  const sentSet = new Set(state.sentArticles.map(normalizeUrl));
  let sentCount = 0;

  // 1. Apenas a ÚLTIMA matéria oficial do LoL
  const lolArticles = await fetchRiotNews();
  if (lolArticles.length > 0) {
    const latestLol = lolArticles[0];
    const normId = normalizeUrl(latestLol.url || latestLol.id);

    if (!sentSet.has(normId)) {
      console.log(`[Cron] Nova atualização do LoL detectada: ${latestLol.title}`);
      const patchData = await fetchFullPatchSummary(latestLol.url);

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
          console.error(`[Cron] Erro ao enviar LoL para grupo ${groupJid}:`, err.message);
        }
      }

      sentSet.add(normId);
    }
  }

  // 2. Apenas a ÚLTIMA matéria oficial do TFT
  const tftArticles = await fetchTftNews();
  if (tftArticles.length > 0) {
    const latestTft = tftArticles[0];
    const normId = normalizeUrl(latestTft.url || latestTft.id);

    if (!sentSet.has(normId)) {
      console.log(`[Cron] Nova atualização do TFT detectada: ${latestTft.title}`);
      const tftData = await fetchFullPatchSummary(latestTft.url);

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

      sentSet.add(normId);
    }
  }

  // 3. Apenas a ÚLTIMA matéria oficial do VALORANT
  const valArticles = await fetchValorantNews();
  if (valArticles.length > 0) {
    const latestVal = valArticles[0];
    const normId = normalizeUrl(latestVal.url || latestVal.id);

    if (!sentSet.has(normId)) {
      console.log(`[Cron] Nova atualização do VALORANT detectada: ${latestVal.title}`);
      const valData = await fetchValorantPatchSummary(latestVal.url);

      for (const groupJid of config.allowedGroups) {
        try {
          if (valData.imageUrl) {
            await activeSocket.sendMessage(groupJid, {
              image: { url: valData.imageUrl },
              caption: valData.formattedMessage
            });
          } else {
            await activeSocket.sendMessage(groupJid, { text: valData.formattedMessage });
          }
          sentCount++;
          await delay(3000);
        } catch (err) {
          console.error(`[Cron] Erro ao enviar VALORANT para grupo ${groupJid}:`, err.message);
        }
      }

      sentSet.add(normId);
    }
  }

  // 4. Apenas a ÚLTIMA matéria oficial do Magic: The Gathering Arena
  const mtgArticles = await fetchMtgNews();
  if (mtgArticles.length > 0) {
    const latestMtg = mtgArticles[0];
    const normId = normalizeUrl(latestMtg.url || latestMtg.id);

    if (!sentSet.has(normId)) {
      console.log(`[Cron] Nova atualização do MTG Arena detectada: ${latestMtg.title}`);
      const mtgData = await fetchMtgPatchSummary(latestMtg.url);

      for (const groupJid of config.allowedGroups) {
        try {
          if (mtgData.imageUrl) {
            await activeSocket.sendMessage(groupJid, {
              image: { url: mtgData.imageUrl },
              caption: mtgData.formattedMessage
            });
          } else {
            await activeSocket.sendMessage(groupJid, { text: mtgData.formattedMessage });
          }
          sentCount++;
          await delay(3000);
        } catch (err) {
          console.error(`[Cron] Erro ao enviar MTG Arena para grupo ${groupJid}:`, err.message);
        }
      }

      sentSet.add(normId);
    }
  }

  state.sentArticles = Array.from(sentSet);
  saveState(state);

  return sentCount > 0 
    ? `Verificação concluída. ${sentCount} nova(s) atualização(ões) transmitida(s).`
    : `Verificação concluída. Nenhuma nova atualização encontrada.`;
}

export function startCronService(sock) {
  activeSocket = sock;
  console.log('[Cron] Monitoramento iniciado (LoL, TFT, Valorant, MTG Arena e ARAM Desordem).');

  seedInitialArticles();

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
