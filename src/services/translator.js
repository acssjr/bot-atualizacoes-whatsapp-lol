/**
 * Serviço de Tradução e Adaptação Contextual para Termos de League of Legends e TFT em PT-BR.
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
 * Formata as Notas de Patch Oficiais para exibição no WhatsApp.
 */
export function formatPatchNotes(title, summary, url, category = 'LoL') {
  const icon = category === 'TFT' ? '🎲' : '⚔️';
  return `${icon} *NOTAS DE ATUALIZAÇÃO - ${category.toUpperCase()}* ${icon}\n\n` +
         `📜 *${title}*\n\n` +
         `${summary}\n\n` +
         `🔗 *Confira as notas completas no site oficial:* ${url}`;
}
