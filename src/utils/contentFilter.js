/**
 * Filtro de Conteúdo de Gameplay do League of Legends e TFT.
 * Filtra assuntos irrelevantes como notícias puramente cosméticas.
 */

export function isRelevantGameplayContent(title = '', snippet = '') {
  const text = (title + ' ' + snippet).toLowerCase();

  // Exclui notícias puramente institucionais ou irrelevantes
  const excludedKeywords = [
    'merch', 'campeonato', 'ingresso', 'cblol', 'ingressos', 'loja virtual'
  ];

  for (const kw of excludedKeywords) {
    if (text.includes(kw)) {
      return false;
    }
  }

  return true;
}
