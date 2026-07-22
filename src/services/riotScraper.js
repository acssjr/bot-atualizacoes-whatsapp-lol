import axios from 'axios';
import * as cheerio from 'cheerio';
import { isRelevantGameplayContent } from '../utils/contentFilter.js';
import { formatPtBrDateWithWeekday } from '../utils/dateFormatter.js';

const RIOT_NEWS_URL = 'https://www.leagueoflegends.com/pt-br/news/game-updates/';
const TFT_NEWS_URL = 'https://teamfighttactics.leagueoflegends.com/pt-br/news/game-updates/';

function cleanRiotTitle(rawTitle = '') {
  let title = rawTitle;
  title = title.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, ' ');
  title = title.replace(/Atualizações do jogo/gi, ' ');
  return title.trim();
}

/**
 * Busca as últimas notícias de Atualizações do Jogo no site oficial da Riot (PT-BR).
 */
export async function fetchRiotNews() {
  try {
    const { data } = await axios.get(RIOT_NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const articles = [];

    $('a[href*="/news/game-updates/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      const fullUrl = href.startsWith('http') ? href : `https://www.leagueoflegends.com${href}`;
      let title = $(el).find('h2').text().trim() || $(el).find('div[data-testid="card-title"], span').first().text().trim();
      title = cleanRiotTitle(title || href.split('/').pop().replace(/-/g, ' '));
      const snippet = $(el).find('p, div[data-testid="card-description"]').text().trim() || title;

      if (title && fullUrl && !articles.some(a => a.url === fullUrl)) {
        if (isRelevantGameplayContent(title, snippet)) {
          articles.push({
            id: fullUrl,
            title,
            snippet,
            url: fullUrl,
            source: 'Riot Games PT-BR'
          });
        }
      }
    });

    return articles;
  } catch (error) {
    console.error('[RiotScraper] Erro ao buscar notícias da Riot:', error.message);
    return [];
  }
}

/**
 * Busca especificamente matérias e notas do TFT.
 */
export async function fetchTftNews() {
  try {
    const mainNews = await fetchRiotNews();
    const tftArticles = mainNews.filter(a => 
      a.title.toLowerCase().includes('tft') || 
      a.title.toLowerCase().includes('teamfight tactics') ||
      a.url.toLowerCase().includes('teamfight-tactics')
    );

    if (tftArticles.length > 0) {
      return tftArticles;
    }

    // Tenta buscar no portal dedicado do TFT
    const { data } = await axios.get(TFT_NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const articles = [];

    $('a[href*="/news/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const fullUrl = href.startsWith('http') ? href : `https://teamfighttactics.leagueoflegends.com${href}`;
      let title = $(el).find('h2, h3').text().trim() || cleanRiotTitle(href.split('/').pop().replace(/-/g, ' '));
      const snippet = $(el).find('p').text().trim() || title;

      if (title && fullUrl && !articles.some(a => a.url === fullUrl)) {
        articles.push({
          id: fullUrl,
          title,
          snippet,
          url: fullUrl,
          source: 'TFT Oficial PT-BR'
        });
      }
    });

    return articles;
  } catch (err) {
    console.error('[RiotScraper] Erro ao buscar notícias de TFT:', err.message);
    return [];
  }
}

/**
 * Tabela de Calendário de Patchs do Ano com Datas Formatadas PT-BR + Dia da Semana.
 */
export function getPatchSchedule() {
  const rawSchedule = [
    { patch: '26.01', date: '2026-01-08' },
    { patch: '26.02', date: '2026-01-22' },
    { patch: '26.03', date: '2026-02-04' },
    { patch: '26.04', date: '2026-02-19' },
    { patch: '26.05', date: '2026-03-04' },
    { patch: '26.06', date: '2026-03-18' },
    { patch: '26.07', date: '2026-04-01' },
    { patch: '26.08', date: '2026-04-15' },
    { patch: '26.09', date: '2026-04-29' },
    { patch: '26.10', date: '2026-05-13' },
    { patch: '26.11', date: '2026-05-28' },
    { patch: '26.12', date: '2026-06-10' },
    { patch: '26.13', date: '2026-06-24' },
    { patch: '26.14', date: '2026-07-15' },
    { patch: '26.15', date: '2026-07-29' },
    { patch: '26.16', date: '2026-08-12' },
    { patch: '26.17', date: '2026-08-26' },
    { patch: '26.18', date: '2026-09-10' },
    { patch: '26.19', date: '2026-09-23' },
    { patch: '26.20', date: '2026-10-07' },
    { patch: '26.21', date: '2026-10-21' },
    { patch: '26.22', date: '2026-11-04' },
    { patch: '26.23', date: '2026-11-18' },
    { patch: '26.24', date: '2026-12-09' }
  ];

  return rawSchedule.map(item => ({
    ...item,
    formattedDate: formatPtBrDateWithWeekday(item.date)
  }));
}

export function getNextAndCurrentPatch() {
  const schedule = getPatchSchedule();
  const today = new Date().toISOString().split('T')[0];

  let current = schedule[0];
  let next = schedule[1];

  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].date <= today) {
      current = schedule[i];
      next = schedule[i + 1] || schedule[i];
    } else {
      break;
    }
  }

  return { current, next };
}
