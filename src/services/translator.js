import axios from 'axios';

/**
 * Serviço de Tradução e Adaptação Contextual para Termos de League of Legends, TFT e MTG Arena em PT-BR.
 */

const DICTIONARY = [
  { en: /\bbuffs?\b/gi, pt: 'Buff (Fortalecimento)' },
  { en: /\bnerfs?\b/gi, pt: 'Nerf (Enfraquecimento)' },
  { en: /\badjustments?\b/gi, pt: 'Ajustes' },
  { en: /\baugments?\b/gi, pt: 'Aprimoramentos' },
  { en: /\btraits?\b/gi, pt: 'Características' },
  { en: /\bpatch notes\b/gi, pt: 'Notas da Atualização' }
];

/**
 * Aplica substituições de termos comuns para termos adaptados do ecossistema LoL/TFT PT-BR.
 * @param {string} text 
 * @returns {string} Texto adaptado
 */
export function translateGamerTerms(text = '') {
  if (!text) return '';
  let result = text;

  for (const rule of DICTIONARY) {
    result = result.replace(rule.en, rule.pt);
  }

  return result;
}

/**
 * Traduz textos em inglês do MTG Arena para Português do Brasil com adaptação gamer.
 * @param {string} text 
 * @returns {Promise<string>} Texto traduzido
 */
export async function translateTextToPtBr(text = '') {
  if (!text || text.trim().length === 0) return '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
    const { data } = await axios.get(url, { timeout: 8000 });
    if (data && data[0]) {
      let translated = data[0].map(item => item[0]).join('');
      
      // Ajustes contextuais de termos gamer do MTG Arena no Brasil
      translated = translated
        .replace(/Magia: A Reunião/gi, 'Magic: The Gathering')
        .replace(/pré-encomenda/gi, 'Pré-venda')
        .replace(/Pacote de Pacotes/gi, 'Pacote de Boosters')
        .replace(/Pacote de Jogos/gi, 'Pacote de Jogo')
        .replace(/Pacote Pass/gi, 'Pacote de Passe')
        .replace(/cartão/gi, 'carta')
        .replace(/cartões/gi, 'cartas')
        .replace(/estilo de cartão/gi, 'estilo de carta')
        .replace(/estilos de cartão/gi, 'estilos de carta');

      return translated;
    }
  } catch (err) {
    console.error('[Translator] Erro na API de tradução:', err.message);
  }

  return text;
}

/**
 * Formata as Notas de Patch Oficiais para exibição no WhatsApp.
 */
export function formatPatchNotes(title, summary, url, category = 'LoL') {
  const icon = category === 'TFT' ? '🎲' : '⚔️';
  return `${icon} *NOTAS DE ATUALIZAÇÃO - ${category.toUpperCase()}* ${icon}\n\n` +
         `📜 *${title}*\n\n` +
         `${summary}\n\n` +
         `🔗 *Confira as notas completas no site oficial:* ${url}`;
}
