import fs from 'fs';
import path from 'path';
import { getNextAndCurrentPatch } from '../services/riotScraper.js';
import { fetchFullPatchSummary, fetchAramDesordemSummary, fetchValorantPatchSummary, fetchMtgPatchSummary, fetchCs2PatchSummary } from '../utils/patchFormatter.js';
import { fetchRiotNews, fetchTftNews, fetchValorantNews, fetchMtgNews, fetchCs2News } from '../services/riotScraper.js';
import { updateAllowedGroups } from '../services/whatsapp.js';
import { broadcastNewFeatureNotice } from '../services/cronService.js';

const CONFIG_FILE = path.resolve('config.json');

export function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return { prefix: '!', allowedGroups: [], autoNotifyGroups: true };
  }
}

export async function handleCommand(commandText, sock, remoteJid) {
  const config = loadConfig();
  const cmd = commandText.trim().toLowerCase();

  // 1. Comando !iniciar ou !inciar para autorizar o grupo atual
  if (cmd === '!iniciar' || cmd === '!inciar') {
    await updateAllowedGroups(sock, remoteJid);

    const welcomeMsg = 
      `🤖 *BOT DE ATUALIZAÇÕES DO LOL, TFT, VALORANT, MTG & CS2 ATIVADO!* 🤖\n\n` +
      `Este grupo foi *autorizado* a receber notificações de patches oficiais.\n\n` +
      `📌 *Comandos disponíveis:*\n` +
      `• *!patch* ou *!lol*: Notas completas do LoL\n` +
      `• *!cs2*: Notas da atualização do Counter-Strike 2 *(Beta — Pode conter bugs)*\n` +
      `• *!mtg* ou *!magic*: Notas do Magic: The Gathering Arena *(Beta — Pode conter bugs)*\n` +
      `• *!vava* ou *!valorant*: Notas completas do VALORANT\n` +
      `• *!ad*: Exclusivo para ARAM: DESORDEM\n` +
      `• *!tft*: Notas do Teamfight Tactics\n` +
      `• *!agenda*: Datas do patch atual e próximo patch\n` +
      `• *!ajuda*: Exibe este menu novamente`;

    await sock.sendMessage(remoteJid, { text: welcomeMsg });
    return;
  }

  // Permissão: verifica se o grupo está na lista de autorizados
  const isGroup = remoteJid.endsWith('@g.us');
  if (isGroup && !config.allowedGroups.includes(remoteJid)) {
    return;
  }

  // 2. Comando !patch ou !lol
  if (cmd === '!patch' || cmd === '!lol') {
    await sock.sendMessage(remoteJid, { text: '🔍 Buscando as notas oficiais mais recentes do LoL...' });
    const articles = await fetchRiotNews();
    const lolArticles = articles.filter(a => !a.title.toLowerCase().includes('tft'));

    if (lolArticles.length > 0) {
      const patchData = await fetchFullPatchSummary(lolArticles[0].url);
      
      if (patchData.imageUrl) {
        await sock.sendMessage(remoteJid, {
          image: { url: patchData.imageUrl },
          caption: patchData.formattedMessage
        });
      } else {
        await sock.sendMessage(remoteJid, { text: patchData.formattedMessage });
      }
    } else {
      const { current, next } = getNextAndCurrentPatch();
      const msg = `⚔️ *PATCH ATUAL DO LOL: ${current.patch}*\n\n` +
                  `Data de Lançamento: *${current.formattedDate}*\n\n` +
                  `📅 *PRÓXIMO PATCH: ${next.patch}*\n` +
                  `Previsão oficial: *${next.formattedDate}*\n\n` +
                  `🔗 *Confira as notas completas no site oficial:* https://www.leagueoflegends.com/pt-br/news/game-updates/`;
      await sock.sendMessage(remoteJid, { text: msg });
    }
  }

  // 3. Comando !cs2
  else if (cmd === '!cs2') {
    await sock.sendMessage(remoteJid, { text: '🔫 Buscando as notas de atualização mais recentes do Counter-Strike 2 (CS2)...' });
    const cs2Data = await fetchCs2PatchSummary();

    if (cs2Data.imageUrl) {
      await sock.sendMessage(remoteJid, {
        image: { url: cs2Data.imageUrl },
        caption: cs2Data.formattedMessage
      });
    } else {
      await sock.sendMessage(remoteJid, { text: cs2Data.formattedMessage });
    }
  }

  // 4. Comando !mtg ou !magic
  else if (cmd === '!mtg' || cmd === '!magic') {
    await sock.sendMessage(remoteJid, { text: '🃏 Buscando as notas de atualização mais recentes do MTG Arena...' });
    const mtgArticles = await fetchMtgNews();

    if (mtgArticles.length > 0) {
      const mtgData = await fetchMtgPatchSummary(mtgArticles[0].url);
      if (mtgData.imageUrl) {
        await sock.sendMessage(remoteJid, {
          image: { url: mtgData.imageUrl },
          caption: mtgData.formattedMessage
        });
      } else {
        await sock.sendMessage(remoteJid, { text: mtgData.formattedMessage });
      }
    } else {
      const fallback = `🃏 *MAGIC: THE GATHERING ARENA - NOTAS DA ATUALIZAÇÃO* (Beta — Pode conter bugs)\n\n🔗 *Confira as notas no site oficial:* https://mtgarena-support.wizards.com/hc/en-us/sections/4402585813268-Patch-Notes`;
      await sock.sendMessage(remoteJid, { text: fallback });
    }
  }

  // 5. Comando !vava ou !valorant
  else if (cmd === '!vava' || cmd === '!valorant') {
    await sock.sendMessage(remoteJid, { text: '🎯 Buscando as notas de atualização mais recentes do VALORANT...' });
    const valArticles = await fetchValorantNews();

    if (valArticles.length > 0) {
      const valData = await fetchValorantPatchSummary(valArticles[0].url);
      if (valData.imageUrl) {
        await sock.sendMessage(remoteJid, {
          image: { url: valData.imageUrl },
          caption: valData.formattedMessage
        });
      } else {
        await sock.sendMessage(remoteJid, { text: valData.formattedMessage });
      }
    } else {
      const fallback = `🎯 *NOTAS DA ATUALIZAÇÃO DO VALORANT*\n\n🔗 *Confira as notas completas no site oficial:* https://playvalorant.com/pt-br/news/game-updates/`;
      await sock.sendMessage(remoteJid, { text: fallback });
    }
  }

  // 6. Comando !ad
  else if (cmd === '!ad' || cmd === '!desordem') {
    await sock.sendMessage(remoteJid, { text: '💥 Buscando mudanças do modo ARAM: DESORDEM...' });
    const articles = await fetchRiotNews();
    
    if (articles.length > 0) {
      const desordemData = await fetchAramDesordemSummary(articles[0].url);
      await sock.sendMessage(remoteJid, { text: desordemData.formattedMessage });
    } else {
      await sock.sendMessage(remoteJid, { text: '💥 *ARAM: DESORDEM*\n\nNenhuma atualização recente de ARAM Desordem no momento.' });
    }
  }

  // 7. Comando !tft
  else if (cmd === '!tft') {
    await sock.sendMessage(remoteJid, { text: '🎲 Buscando as notas oficiais do Teamfight Tactics...' });
    const tftArticles = await fetchTftNews();

    if (tftArticles.length > 0) {
      const tftData = await fetchFullPatchSummary(tftArticles[0].url);
      
      if (tftData.imageUrl) {
        await sock.sendMessage(remoteJid, {
          image: { url: tftData.imageUrl },
          caption: tftData.formattedMessage
        });
      } else {
        await sock.sendMessage(remoteJid, { text: tftData.formattedMessage });
      }
    } else {
      const msg = `🎲 *TFT - NOTAS DE ATUALIZAÇÃO*\n\n` +
                  `📜 *NOTAS DA ATUALIZAÇÃO DO TFT*\n\n` +
                  `🔹 *Aprimoramentos*: Balanceamento nos Augments de Estágio.\n` +
                  `🔹 *Unidades*: Rebalanceamento em campeões Tier 4 e 5.\n\n` +
                  `🔗 *Confira as notas completas no site oficial:* https://teamfighttactics.leagueoflegends.com/pt-br/news/game-updates/`;
      await sock.sendMessage(remoteJid, { text: msg });
    }
  }

  // 8. Comando !agenda ou !proximo
  else if (cmd === '!agenda' || cmd === '!proximo') {
    const { current, next } = getNextAndCurrentPatch();
    const agendaMsg = 
      `📅 *CALENDÁRIO DE ATUALIZAÇÕES DO LOL & TFT*\n\n` +
      `⚔️ *PATCH ATUAL (${current.patch})*\n` +
      `Lançado em: *${current.formattedDate}*\n\n` +
      `🚀 *PRÓXIMO PATCH (${next.patch})*\n` +
      `Previsão oficial: *${next.formattedDate}*\n\n` +
      `📌 *Horário padrão dos servidores:* 07:00 BRT (Quarta-feira)`;

    await sock.sendMessage(remoteJid, { text: agendaMsg });
  }

  // 9. Comando !ajuda ou !help
  else if (cmd === '!ajuda' || cmd === '!help') {
    const helpMsg = 
      `📌 *COMANDOS DISPONÍVEIS - BOT DE ATUALIZAÇÕES* 📌\n\n` +
      `• *!patch* ou *!lol*: Notas completas de atualização do LoL com Infográfico e Link Oficial.\n` +
      `• *!cs2*: Notas de atualização do Counter-Strike 2 *(Beta — Pode conter bugs)*.\n` +
      `• *!mtg* ou *!magic*: Notas do Magic: The Gathering Arena *(Beta — Pode conter bugs)*.\n` +
      `• *!vava* ou *!valorant*: Notas completas do VALORANT com Agentes, Armas e Infográfico.\n` +
      `• *!ad*: Exclusivo para mudanças do modo *ARAM: DESORDEM*.\n` +
      `• *!tft*: Notas completas do Teamfight Tactics com Infográfico.\n` +
      `• *!agenda*: Cronograma do patch atual e próximo patch com dia da semana.\n` +
      `• *!iniciar*: Autoriza este grupo a receber mensagens automáticas.`;

    await sock.sendMessage(remoteJid, { text: helpMsg });
  }
}
