/**
 * Curador & Classificador de Patch Notes:
 * 1. Limpeza de caracteres corrompidos (\uFFFD).
 * 2. Remoção de piadas e frases lúdicas antes dos dois-pontos.
 */

/**
 * Remove piadas, frases lúdicas e corrige caracteres corrompidos \uFFFD.
 */
export function cleanPlayfulText(rawText = '') {
  if (!rawText) return '';
  let text = rawText.trim();

  // Substitui caractere de substituição \uFFFD corrompido por hífen padrão ' - '
  text = text.replace(/[\uFFFD\u00A0]+/g, ' - ');
  text = text.replace(/\s*-\s*-\s*/g, ' - ');
  text = text.replace(/(\d)\s*-\s*(\d)/g, '$1 - $2');

  // Remove aspas ou piadinhas comuns antes do primeiro ':' se houver pontuação de piada
  if (text.includes(':')) {
    const parts = text.split(':');
    const prefix = parts[0].trim();
    if (prefix.includes('?') || prefix.includes('"') || prefix.length > 30) {
      text = parts.slice(1).join(':').trim();
    }
  }

  // Remove aspas soltas no início ou fim
  text = text.replace(/^["'“]/, '').replace(/["'”]$/, '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Determina a tag de balanceamento (temporariamente oculta nas mensagens a pedido do usuário).
 */
export function determineBalanceTag(sectionTitle = '', entityName = '', changesList = []) {
  return ''; // Oculto temporariamente por solicitação
}
