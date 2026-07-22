import axios from 'axios';
import * as cheerio from 'cheerio';
import { isRelevantGameplayContent } from '../utils/contentFilter.js';

const RIOT_NEWS_URL = 'https://www.leagueoflegends.com/pt-br/news/game-updates/';
const TFT_NEWS_URL = 'https://teamfighttactics.leagueoflegends.com/pt-br/news/game-updates/';
const VALORANT_NEWS_URL = 'https://playvalorant.com/pt-br/news/game-updates/';
const MTG_API_URL = 'https://mtgarena-support.wizards.com/api/v2/help_center/en-us/sections/4402585813268/articles.json';

/**
 * Raspa matérias de atualizações do League of Legends.
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

    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).find('h2, h3, .title').first().text().trim() || $(el).text().trim();
      const snippet = $(el).find('p, .description').first().text().trim();

      if (href.includes('/news/game-updates/') && (href.includes('patch') || href.includes('notas-da-atualizacao') || href.includes('notas-do-patch'))) {
        const fullUrl = href.startsWith('http') ? href : `https://www.leagueoflegends.com${href}`;
        const id = fullUrl;

        if (isRelevantGameplayContent(title, snippet)) {
          if (!articles.some(a => a.id === id)) {
            articles.push({ id, title, snippet, url: fullUrl, source: 'Riot Games LoL' });
          }
        }
      }
    });

    return articles;
  } catch (err) {
    console.error('[RiotScraper] Erro ao raspar notícias do LoL:', err.message);
    return [];
  }
}

/**
 * Raspa matérias de atualizações do Teamfight Tactics.
 */
export async function fetchTftNews() {
  try {
    const { data } = await axios.get(TFT_NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const articles = [];

    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).find('h2, h3, .title').first().text().trim() || $(el).text().trim();
      const snippet = $(el).find('p, .description').first().text().trim();

      if (href.includes('/news/game-updates/') && (href.includes('patch') || href.includes('tft') || href.includes('atualizacao'))) {
        const fullUrl = href.startsWith('http') ? href : `https://teamfighttactics.leagueoflegends.com${href}`;
        const id = fullUrl;

        if (!articles.some(a => a.id === id)) {
          articles.push({ id, title, snippet, url: fullUrl, source: 'Riot Games TFT' });
        }
      }
    });

    return articles;
  } catch (err) {
    console.error('[RiotScraper] Erro ao raspar notícias do TFT:', err.message);
    return [];
  }
}

/**
 * Raspa matérias de atualizações do VALORANT.
 */
export async function fetchValorantNews() {
  try {
    const { data } = await axios.get(VALORANT_NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    const articles = [];

    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).find('h2, h3, p, span').first().text().trim() || $(el).text().trim();

      if (href.includes('/news/game-updates/') && (href.includes('patch-notes') || href.includes('notas-da-atualizacao') || href.includes('atualizacao'))) {
        const fullUrl = href.startsWith('http') ? href : `https://playvalorant.com${href}`;
        const id = fullUrl;

        if (!articles.some(a => a.id === id)) {
          articles.push({ id, title, url: fullUrl, source: 'Riot Games Valorant' });
        }
      }
    });

    return articles;
  } catch (err) {
    console.error('[RiotScraper] Erro ao raspar notícias do VALORANT:', err.message);
    return [];
  }
}

/**
 * Busca notícias de Patch Notes do Magic: The Gathering Arena via Zendesk REST API.
 */
export async function fetchMtgNews() {
  try {
    const { data } = await axios.get(MTG_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const articles = [];
    if (data.articles && data.articles.length > 0) {
      data.articles.forEach(art => {
        articles.push({
          id: art.html_url,
          title: art.title,
          url: art.html_url,
          body: art.body,
          createdAt: art.created_at,
          source: 'MTG Arena'
        });
      });
    }

    return articles;
  } catch (err) {
    console.error('[RiotScraper] Erro ao buscar API do MTG Arena:', err.message);
    return [];
  }
}

/**
 * Retorna as informações do próximo patch do League of Legends.
 */
export function getNextAndCurrentPatch() {
  return {
    current: { patch: '26.14', date: '2026-07-15', formattedDate: 'Quarta-feira, 15 de Julho de 2026' },
    next: { patch: '26.15', date: '2026-07-29', formattedDate: 'Quarta-feira, 29 de Julho de 2026' }
  };
}
