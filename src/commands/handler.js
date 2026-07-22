import fs from 'fs';
import path from 'path';
import { fetchRiotNews, fetchTftNews, fetchValorantNews, fetchMtgNews, getNextAndCurrentPatch } from '../services/riotScraper.js';
import { fetchFullPatchSummary, fetchAramDesordemSummary, fetchValorantPatchSummary, fetchMtgPatchSummary } from '../utils/patchFormatter.js';
import { updateAllowedGroups } from '../services/whatsapp.js';

const STATE_FILE = path.resolve('state.json');

function getState() {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {
      lol: { currentPatch: '26.14', nextPatch: '26.15' },
      tft: { currentPatch: '17.7', currentSet: 'Set 13: Bugigangas e Engenhocas' }
    };
  }
}

export async function handleCommand(text, sock, remoteJid) {
  const trimmed = text.trim();
  const args = trimmed.split(/\s+/);
  const command = args[0].toLowerCase();

  switch (command) {
    case '!iniciar':
    case '!inciar': {
      if (remoteJid.endsWith('@g.us')) {
        await updateAllowedGroups(sock, remoteJid);
      }
      const welcomeMsg = `🤖 *BOT DE PATCH NOTES ATIVADO!*\n\n` +
                         `✅ *Grupo Autorizado com Sucesso!*\n` +
                         `Este grupo agora receberá automaticamente todas as notas de atualização oficiais do LoL, TFT, VALORANT, MTG Arena (Beta — Pode conter bugs) e ARAM Desordem.\n\n` +
                         `📌 *Como usar:*\n` +
                         `Digite *!ajuda* para ver a lista de comandos disponíveis a qualquer momento.`;
      await sock.sendMessage(remoteJid, { text: welcomeMsg });
      break;
    }

    case '!ajuda':
    case '!help': {
      const helpMsg = `🤖 *COMANDOS DISPONÍVEIS*\n\n` +
                      `• *!patch* ou *!lol*: Notas da atualização do League of Legends com Infográfico e link oficial.\n` +
                      `• *!mtg* ou *!magic*: Notas da atualização do Magic: The Gathering Arena *(Beta — Pode conter bugs)*.\n` +
                      `• *!vava* ou *!valorant*: Notas de atualização do VALORANT.\n` +
                      `• *!ad*: Mudanças exclusivas do modo *ARAM: DESORDEM*.\n` +
                      `• *!tft*: Notas de atualização do Teamfight Tactics com Infográfico e link oficial.\n` +
                      `• *!agenda* ou *!proximo*: Próximas datas de atualizações em PT-BR.\n` +
                      `• *!iniciar*: Confirma a autorização deste grupo no bot.`;
      await sock.sendMessage(remoteJid, { text: helpMsg });
      break;
    }

    case '!patch':
    case '!lol': {
      await sock.sendMessage(remoteJid, { text: '⏳ *Buscando notas do LoL com infográfico de Destaques...*' });
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
        const { current } = getNextAndCurrentPatch();
        await sock.sendMessage(remoteJid, {
          text: `⚔️ *PATCH ATUAL DO LOL: ${current.patch}*\n\nData de Lançamento: *${current.formattedDate}*`
        });
      }
      break;
    }

    case '!mtg':
    case '!magic': {
      await sock.sendMessage(remoteJid, { text: '🃏 *Buscando notas do Magic: The Gathering Arena...*' });
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
        await sock.sendMessage(remoteJid, { text: `🃏 *MAGIC: THE GATHERING ARENA - NOTAS DA ATUALIZAÇÃO* (Beta — Pode conter bugs)\n\nAcompanhe no site oficial!` });
      }
      break;
    }

    case '!vava':
    case '!valorant': {
      await sock.sendMessage(remoteJid, { text: '🎯 *Buscando notas do VALORANT com infográfico de Destaques...*' });
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
        await sock.sendMessage(remoteJid, { text: `🎯 *VALORANT - NOTAS DE ATUALIZAÇÃO*\n\nAcompanhe as notas do VALORANT no site oficial!` });
      }
      break;
    }

    case '!ad':
    case '!desordem': {
      await sock.sendMessage(remoteJid, { text: '💥 *Buscando alterações de ARAM: DESORDEM...*' });
      const articles = await fetchRiotNews();
      if (articles.length > 0) {
        const desordemData = await fetchAramDesordemSummary(articles[0].url);
        await sock.sendMessage(remoteJid, { text: desordemData.formattedMessage });
      } else {
        await sock.sendMessage(remoteJid, { text: '💥 Nenhuma matéria de ARAM Desordem encontrada no momento.' });
      }
      break;
    }

    case '!tft': {
      await sock.sendMessage(remoteJid, { text: '🎲 *Buscando notas do TFT com infográfico de Destaques...*' });
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
        await sock.sendMessage(remoteJid, { text: `🎲 *TFT - NOTAS DE ATUALIZAÇÃO*\n\nAcompanhe as notas do TFT no site oficial!` });
      }
      break;
    }

    case '!agenda':
    case '!proximo': {
      const { current, next } = getNextAndCurrentPatch();
      const msg = `📅 *CALENDÁRIO DE ATUALIZAÇÕES (LoL, TFT, VALORANT & MTG)* 📅\n\n` +
                  `✅ *Patch Atual:* ${current.patch}\n` +
                  `📆 *Lançamento:* ${current.formattedDate}\n\n` +
                  `🚀 *Próximo Patch:* ${next.patch}\n` +
                  `📆 *Data Prevista:* ${next.formattedDate}\n\n` +
                  `💡 *Horário Habitual:* Manutenção nas madrugadas de quarta-feira.`;
      await sock.sendMessage(remoteJid, { text: msg });
      break;
    }

    default:
      break;
  }
}
