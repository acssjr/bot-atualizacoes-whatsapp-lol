import axios from 'axios';

/**
 * Raspa artigos de notícias oficiais do League of Legends PT-BR.
 */
export async function fetchRiotNews() {
  try {
    const url = 'https://www.leagueoflegends.com/page-data/pt-br/news/game-updates/page-data.json';
    const { data } = await axios.get(url, { timeout: 10000 });

    const articles = data?.result?.data?.allArticles?.nodes || [];
    
    // Filtra artigos de notas de patch do LoL, excluindo TFT se necessário
    const patchArticles = articles.filter(article => {
      const title = article.title.toLowerCase();
      const cat = article.category?.[0]?.title?.toLowerCase() || '';
      return title.includes('atualização') || title.includes('patch') || cat.includes('atualizações do jogo');
    });

    return patchArticles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: `https://www.leagueoflegends.com/pt-br${article.url.url}`,
      imageUrl: article.featured_media?.banner?.url || article.featured_media?.url || '',
      date: article.date
    }));
  } catch (err) {
    console.error('[Scraper] Erro ao raspar notícias do LoL:', err.message);
    return [];
  }
}

/**
 * Raspa artigos de notícias oficiais do Teamfight Tactics (TFT) PT-BR.
 */
export async function fetchTftNews() {
  try {
    const url = 'https://teamfighttactics.leagueoflegends.com/page-data/pt-br/news/page-data.json';
    const { data } = await axios.get(url, { timeout: 10000 });

    const articles = data?.result?.data?.allArticles?.nodes || [];

    const tftArticles = articles.filter(article => {
      const title = article.title.toLowerCase();
      return title.includes('tft') || title.includes('teamfight tactics') || title.includes('notas da atualização');
    });

    return tftArticles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: `https://teamfighttactics.leagueoflegends.com/pt-br${article.url.url}`,
      imageUrl: article.featured_media?.banner?.url || article.featured_media?.url || '',
      date: article.date
    }));
  } catch (err) {
    console.error('[Scraper] Erro ao raspar notícias do TFT:', err.message);
    return [];
  }
}

/**
 * Raspa artigos de notícias oficiais do VALORANT (playvalorant.com).
 */
export async function fetchValorantNews() {
  try {
    const url = 'https://playvalorant.com/page-data/pt-br/news/game-updates/page-data.json';
    const { data } = await axios.get(url, { timeout: 10000 });

    const articles = data?.result?.data?.allArticles?.nodes || [];

    const valArticles = articles.filter(article => {
      const title = article.title.toLowerCase();
      return title.includes('notas da atualização') || title.includes('patch');
    });

    return valArticles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: `https://playvalorant.com/pt-br${article.url.url}`,
      imageUrl: article.featured_media?.banner?.url || article.featured_media?.url || '',
      date: article.date
    }));
  } catch (err) {
    console.error('[Scraper] Erro ao raspar notícias do VALORANT:', err.message);
    return [];
  }
}

/**
 * Raspa artigos de notícias de patch do Magic: The Gathering Arena via Zendesk API.
 */
export async function fetchMtgNews() {
  try {
    const apiUrl = 'https://mtgarena-support.wizards.com/api/v2/help_center/en-us/sections/4402585813268/articles.json';
    const { data } = await axios.get(apiUrl, { timeout: 10000 });

    const articles = data?.articles || [];

    return articles.map(article => ({
      id: String(article.id),
      title: article.title,
      description: article.snippet || '',
      url: article.html_url || `https://mtgarena-support.wizards.com/hc/en-us/articles/${article.id}`,
      body: article.body || '',
      date: article.created_at
    }));
  } catch (err) {
    console.error('[Scraper] Erro ao raspar notícias do MTG Arena via Zendesk API:', err.message);
    return [];
  }
}

/**
 * Raspa artigos de notícias de notas de atualização do Counter-Strike 2 via Steam API.
 */
export async function fetchCs2News() {
  try {
    const steamApiUrl = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=730&count=10&feeds=steam_community_announcements&format=json';
    const { data } = await axios.get(steamApiUrl, { timeout: 10000 });
    const newsItems = data?.appnews?.newsitems || [];

    const updates = newsItems.filter(item => 
      item.title.toLowerCase().includes('update') || 
      item.title.toLowerCase().includes('release notes') || 
      item.contents.includes('[ GAMEPLAY ]') || 
      item.contents.includes('[ MAPS ]') || 
      item.contents.includes('[ MISC ]') ||
      item.contents.includes('\[')
    );

    return updates.map(item => {
      const dateObj = new Date(item.date * 1000);
      const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      return {
        id: item.gid,
        title: item.title,
        url: item.url || `https://www.counter-strike.net/news/updates`,
        dateTimestamp: item.date,
        formattedDate,
        rawContents: item.contents
      };
    });
  } catch (err) {
    console.error('[Scraper] Erro ao buscar notícias do CS2 via Steam API:', err.message);
    return [];
  }
}

/**
 * Calcula a data estimada do próximo patch do League of Legends.
 */
export function getNextAndCurrentPatch() {
  const currentPatchDate = new Date('2026-07-15T00:00:00-03:00');
  const nextPatchDate = new Date('2026-07-29T00:00:00-03:00');
  
  const options = { day: '2-digit', month: '2-digit' };
  const dayOfWeekOptions = { weekday: 'long' };

  const dayOfWeek = nextPatchDate.toLocaleDateString('pt-BR', dayOfWeekOptions);
  const formattedDayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  return {
    current: {
      patch: '26.14',
      formattedDate: currentPatchDate.toLocaleDateString('pt-BR', options)
    },
    next: {
      patch: '26.15',
      formattedDate: `${formattedDayOfWeek}, ${nextPatchDate.toLocaleDateString('pt-BR', options)}`
    }
  };
}
