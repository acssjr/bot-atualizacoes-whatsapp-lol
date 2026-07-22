import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanPlayfulText } from './patchCurator.js';

/**
 * Raspa o conteúdo completo da página de notas de patch oficial da Riot PT-BR (LoL ou TFT).
 * Retorna a mensagem formatada, a imagem infográfica de Destaques (se houver) e o link oficial no rodapé.
 *
 * @param {string} patchUrl 
 * @returns {Promise<{ formattedMessage: string, imageUrl: string, url: string }>}
 */
export async function fetchFullPatchSummary(patchUrl) {
  try {
    const { data } = await axios.get(patchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const container = $('#patch-notes-container');
    const title = $('h1, header h1, .header-primary').first().text().trim() || 'Notas da Atualização';

    // 1. Extração da Imagem de Destaques da Atualização (Infográfico para LoL ou TFT)
    let highlightsImageUrl = '';

    container.find('h2').each((i, h2) => {
      if ($(h2).text().trim().toLowerCase().includes('destaques')) {
        const imgEl = $(h2).nextUntil('h2', 'figure, a, div, p').find('img').first();
        const src = imgEl.attr('src') || imgEl.attr('data-src') || '';
        if (src) highlightsImageUrl = src;
      }
    });

    if (!highlightsImageUrl) {
      $('a, figure, img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('href') || $(el).attr('data-src') || '';
        if (src && src.includes('cmsassets') && (src.includes('1920x') || src.includes('3067x') || src.includes('2250x') || src.includes('highlights') || src.includes('Destaques'))) {
          if (!highlightsImageUrl) highlightsImageUrl = src;
        }
      });
    }

    const championBlocks = [];
    const itemBlocks = [];
    const systemBlocks = [];
    const bugFixes = [];

    // 2. Extração por blocos de LoL (.patch-change-block)
    if (container.find('.patch-change-block').length > 0) {
      container.find('.patch-change-block').each((i, block) => {
        const entityName = $(block).find('.change-title, h3').first().text().trim();
        if (!entityName || entityName.length > 50) return;

        const parentSection = $(block).parents().prevAll('h2').first().text().trim() || 
                              $(block).prevAll('h2').first().text().trim();

        const abilityGroup = [];

        $(block).find('h4, ul').each((j, child) => {
          const tagName = $(child).prop('tagName').toLowerCase();
          if (tagName === 'h4') {
            const abilityTitle = cleanPlayfulText($(child).text().trim());
            if (abilityTitle && !abilityTitle.includes('Riot')) {
              abilityGroup.push({ ability: abilityTitle, lines: [] });
            }
          } else if (tagName === 'ul') {
            const liLines = [];
            $(child).find('li').each((k, li) => {
              const lineText = $(li).text().trim();
              if (lineText && lineText.length > 3) {
                liLines.push(cleanPlayfulText(lineText));
              }
            });

            if (abilityGroup.length > 0) {
              abilityGroup[abilityGroup.length - 1].lines.push(...liLines);
            } else if (liLines.length > 0) {
              abilityGroup.push({ ability: 'Geral', lines: liLines });
            }
          }
        });

        if (abilityGroup.length > 0) {
          const entityObj = {
            name: cleanPlayfulText(entityName),
            abilities: abilityGroup
          };

          const parentLower = parentSection.toLowerCase();
          if (parentLower.includes('item') || parentLower.includes('itens')) {
            itemBlocks.push(entityObj);
          } else if (parentLower.includes('sistema') || parentLower.includes('sistemas')) {
            systemBlocks.push(entityObj);
          } else {
            championBlocks.push(entityObj);
          }
        }
      });
    } else {
      // 3. Extração para TFT (Estrutura baseada em H3/H4 e UL)
      let currentSection = '';
      container.find('h2, h3, h4, ul').each((i, el) => {
        const tag = $(el).prop('tagName').toLowerCase();
        const text = cleanPlayfulText($(el).text().trim());

        if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
          if (text.length > 0 && text.length < 80 && !text.toLowerCase().includes('destaques') && !text.toLowerCase().includes('esports')) {
            currentSection = text;
          }
        } else if (tag === 'ul' && currentSection) {
          const lines = [];
          $(el).find('li').each((j, li) => {
            const t = cleanPlayfulText($(li).text().trim());
            if (t && t.length > 3) lines.push(`• ${t}`);
          });

          if (lines.length > 0) {
            if (currentSection.toLowerCase().includes('bug') || currentSection.toLowerCase().includes('correções')) {
              bugFixes.push(...lines);
            } else {
              championBlocks.push({
                name: currentSection,
                abilities: [{ ability: 'Geral', lines }]
              });
            }
          }
        }
      });
    }

    // 4. Montagem da Mensagem Completa
    let msg = `📜 *${cleanPlayfulText(title).toUpperCase()}*\n\n`;

    if (championBlocks.length > 0) {
      msg += `⚔️ *ALTERAÇÕES & BALANCEAMENTO:*\n\n`;
      championBlocks.forEach(c => {
        msg += `🔹 *${c.name.toUpperCase()}*\n`;
        c.abilities.forEach(a => {
          if (a.ability !== 'Geral') {
            msg += `  🎯 *${a.ability}*\n`;
          }
          a.lines.forEach(l => {
            msg += `    ${l.startsWith('•') ? l : '• ' + l}\n`;
          });
        });
        msg += `\n`;
      });
    }

    if (itemBlocks.length > 0) {
      msg += `🛡️ *ITENS:*\n\n`;
      itemBlocks.forEach(item => {
        msg += `🔹 *${item.name.toUpperCase()}*\n`;
        item.abilities.forEach(a => {
          a.lines.forEach(l => {
            msg += `  • ${l}\n`;
          });
        });
        msg += `\n`;
      });
    }

    if (systemBlocks.length > 0) {
      msg += `🌀 *SISTEMAS:*\n\n`;
      systemBlocks.forEach(sys => {
        msg += `🔹 *${sys.name.toUpperCase()}*\n`;
        sys.abilities.forEach(a => {
          a.lines.forEach(l => {
            msg += `  • ${l}\n`;
          });
        });
        msg += `\n`;
      });
    }

    if (bugFixes.length > 0) {
      msg += `🐛 *CORREÇÕES DE BUGS:*\n\n` + bugFixes.slice(0, 8).join('\n\n') + `\n\n`;
    }

    msg += `🔗 *Confira as notas completas no site oficial:* ${patchUrl}`;

    return {
      formattedMessage: msg,
      imageUrl: highlightsImageUrl,
      url: patchUrl
    };
  } catch (err) {
    console.error('[PatchFormatter] Erro ao raspar patch completo:', err.message);
    const fallbackMsg = `📜 *NOTAS DA ATUALIZAÇÃO*\n\nConfira as alterações de balanceamento aplicadas nesta atualização!\n\n🔗 *Confira as notas completas no site oficial:* ${patchUrl}`;
    return {
      formattedMessage: fallbackMsg,
      imageUrl: '',
      url: patchUrl
    };
  }
}

/**
 * Raspa EXCLUSIVAMENTE a seção de ARAM: DESORDEM para o comando !ad.
 *
 * @param {string} patchUrl 
 * @returns {Promise<{ formattedMessage: string, url: string }>}
 */
export async function fetchAramDesordemSummary(patchUrl) {
  try {
    const { data } = await axios.get(patchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const container = $('#patch-notes-container');

    const desordemAugments = [];
    const desordemBugs = [];

    let inDesordem = false;
    let currentSubGroup = '';
    let currentAugment = '';

    container.find('*').each((i, el) => {
      const tagName = $(el).prop('tagName').toLowerCase();
      const text = $(el).text().trim();

      if (tagName === 'h2') {
        if (text.toLowerCase().includes('desordem') || text.toLowerCase().includes('aram: desordem')) {
          inDesordem = true;
        } else if (inDesordem && text.length > 0) {
          inDesordem = false;
        }
        return;
      }

      if (inDesordem) {
        if (tagName === 'h4') {
          currentSubGroup = cleanPlayfulText(text);
        } else if (tagName === 'p') {
          if (text && !text.includes('Faaala') && !text.includes('Desordeiros') && text.length < 50) {
            currentAugment = cleanPlayfulText(text);
          }
        } else if (tagName === 'li') {
          if (text && text.length > 3) {
            const lineClean = cleanPlayfulText(text);
            if (currentSubGroup.toLowerCase().includes('bug') || currentSubGroup.toLowerCase().includes('correções')) {
              desordemBugs.push(`  • ${lineClean}`);
            } else {
              desordemAugments.push({
                augment: currentAugment || 'Aprimoramento',
                line: lineClean
              });
            }
          }
        }
      }
    });

    let msg = `💥 *ARAM: DESORDEM - NOTAS & BALANCEAMENTO* 💥\n\n`;

    if (desordemAugments.length > 0) {
      msg += `✨ *APRIMORAMENTOS & MECÂNICAS:*\n\n`;
      let lastAugment = '';
      desordemAugments.forEach(item => {
        if (item.augment !== lastAugment) {
          if (lastAugment !== '') msg += `\n`;
          msg += `🔹 *${item.augment}*\n`;
          lastAugment = item.augment;
        }
        msg += `    • ${item.line}\n`;
      });
      msg += `\n\n`;
    }

    if (desordemBugs.length > 0) {
      msg += `🐛 *CORREÇÕES DE BUGS DO ARAM DESORDEM:*\n\n` + desordemBugs.join('\n\n') + `\n\n`;
    }

    if (desordemAugments.length === 0 && desordemBugs.length === 0) {
      msg += `Nenhuma mudança específica para o modo ARAM Desordem neste patch.\n\n`;
    }

    msg += `🔗 *Confira as notas completas no site oficial:* ${patchUrl}`;

    return {
      formattedMessage: msg,
      url: patchUrl
    };
  } catch (err) {
    console.error('[PatchFormatter] Erro ao buscar ARAM Desordem:', err.message);
    const fallback = `💥 *ARAM: DESORDEM*\n\nConfira as atualizações e aprimoramentos do modo ARAM Desordem no jogo!\n\n🔗 *Confira as notas completas no site oficial:* ${patchUrl}`;
    return {
      formattedMessage: fallback,
      url: patchUrl
    };
  }
}

/**
 * Raspa a página de notas de patch oficial do VALORANT (playvalorant.com)
 *
 * @param {string} patchUrl 
 * @returns {Promise<{ formattedMessage: string, imageUrl: string, url: string }>}
 */
export async function fetchValorantPatchSummary(patchUrl) {
  try {
    const { data } = await axios.get(patchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    const title = $('h1').first().text().trim().replace(/TODAS AS PLATAFORMAS.*$/gi, '').trim() || 'Notas da Atualização do VALORANT';

    // 1. Extração da Imagem do Header do Valorant
    let imageUrl = '';
    const imgMatches = data.match(/https:\/\/cmsassets\.rgpub\.io\/sanity\/images\/dsfx7636\/news_live\/[a-f0-9]+-1920x1080\.jpg\?accountingTag=VAL/gi);
    if (imgMatches && imgMatches.length > 0) {
      imageUrl = imgMatches[0];
    } else {
      const fallbackMatches = data.match(/https:\/\/(cmsassets\.rgpub\.io|images\.contentstack\.io)[^"'\s>\\]+/gi);
      if (fallbackMatches && fallbackMatches.length > 0) {
        imageUrl = fallbackMatches.find(m => m.includes('news_live') && m.includes('1920x1080')) || fallbackMatches[0];
      }
    }

    // 2. Extração das Seções do Valorant
    const agentBlocks = [];
    const weaponBlocks = [];
    const systemBlocks = [];
    const bugFixes = [];

    let currentSection = '';

    $('h2, ul').each((i, el) => {
      const tag = $(el).prop('tagName').toLowerCase();
      const text = $(el).text().trim();

      if (tag === 'h2') {
        const tLower = text.toLowerCase();
        if (tLower.includes('agente')) currentSection = 'agentes';
        else if (tLower.includes('arma')) currentSection = 'armas';
        else if (tLower.includes('comportamento') || tLower.includes('sistema') || tLower.includes('social')) currentSection = 'sistemas';
        else if (tLower.includes('bug') || tLower.includes('correções')) currentSection = 'bugs';
        else currentSection = '';
      } else if (tag === 'ul' && currentSection) {
        if ($(el).parents('ul').length > 0) return;

        $(el).children('li').each((j, li) => {
          const entityName = $(li).children('span, font, strong').first().text().trim() || 
                             $(li).clone().children('ul').remove().end().text().trim();

          const subUl = $(li).children('ul');
          if (subUl.length > 0) {
            subUl.children('li').each((k, subLi) => {
              const skillName = $(subLi).children('span, font, strong').first().text().trim() || '';
              const desc = $(subLi).find('li').text().trim() || $(subLi).clone().children('ul').remove().end().text().trim();

              const cleanAgent = cleanPlayfulText(entityName);
              const cleanSkill = cleanPlayfulText(skillName);
              let cleanDesc = cleanPlayfulText(desc);

              if (cleanSkill && cleanDesc.startsWith(cleanSkill)) {
                cleanDesc = cleanDesc.replace(cleanSkill, '').trim();
              }

              if (cleanAgent && (cleanSkill || cleanDesc)) {
                if (currentSection === 'agentes') {
                  agentBlocks.push({ entity: cleanAgent, skill: cleanSkill, desc: cleanDesc });
                } else if (currentSection === 'armas') {
                  weaponBlocks.push({ entity: cleanAgent, skill: cleanSkill, desc: cleanDesc });
                }
              }
            });
          } else {
            const lineClean = cleanPlayfulText($(li).text().trim());
            if (lineClean && lineClean.length > 5 && !lineClean.includes('Confira os detalhes')) {
              if (currentSection === 'bugs') {
                bugFixes.push(`• ${lineClean}`);
              } else if (currentSection === 'sistemas') {
                systemBlocks.push(`• ${lineClean}`);
              }
            }
          }
        });
      }
    });

    // 3. Montagem com Espaçamento Limpo
    let msg = `🎯 *${cleanPlayfulText(title).toUpperCase()}*\n\n`;

    if (agentBlocks.length > 0) {
      msg += `👥 *ATUALIZAÇÕES DOS AGENTES:*\n\n`;
      let lastEntity = '';
      agentBlocks.forEach(b => {
        if (b.entity !== lastEntity) {
          if (lastEntity !== '') msg += `\n`;
          msg += `🔹 *${b.entity.toUpperCase()}*\n`;
          lastEntity = b.entity;
        }
        if (b.skill) {
          msg += `  🎯 *${b.skill}*\n`;
        }
        if (b.desc) {
          msg += `    • ${b.desc}\n`;
        }
      });
      msg += `\n`;
    }

    if (weaponBlocks.length > 0) {
      msg += `🔫 *ATUALIZAÇÕES DE ARMAS:*\n\n`;
      let lastEntity = '';
      weaponBlocks.forEach(b => {
        if (b.entity !== lastEntity) {
          if (lastEntity !== '') msg += `\n`;
          msg += `🔹 *${b.entity.toUpperCase()}*\n`;
          lastEntity = b.entity;
        }
        if (b.skill) {
          msg += `  🎯 *${b.skill}*\n`;
        }
        if (b.desc) {
          msg += `    • ${b.desc}\n`;
        }
      });
      msg += `\n`;
    }

    if (systemBlocks.length > 0) {
      msg += `🌀 *SISTEMAS & COMPORTAMENTO:*\n\n` + systemBlocks.join('\n\n') + `\n\n`;
    }

    if (bugFixes.length > 0) {
      msg += `🐛 *CORREÇÕES DE BUGS:*\n\n` + bugFixes.slice(0, 8).join('\n\n') + `\n\n`;
    }

    msg += `🔗 *Confira as notas completas no site oficial:* ${patchUrl}`;

    return {
      formattedMessage: msg,
      imageUrl,
      url: patchUrl
    };
  } catch (err) {
    console.error('[PatchFormatter] Erro ao raspar VALORANT:', err.message);
    return {
      formattedMessage: `🎯 *NOTAS DA ATUALIZAÇÃO DO VALORANT*\n\n🔗 *Confira as notas completas no site oficial:* ${patchUrl}`,
      imageUrl: '',
      url: patchUrl
    };
  }
}
