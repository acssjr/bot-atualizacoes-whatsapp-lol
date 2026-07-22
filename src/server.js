import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fetchRiotNews, fetchTftNews, getNextAndCurrentPatch } from './services/riotScraper.js';
import { fetchFullPatchSummary, fetchAramDesordemSummary } from './utils/patchFormatter.js';
import { runManualCronCheck } from './services/cronService.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;
const STATE_FILE = path.resolve('state.json');
const CONFIG_FILE = path.resolve('config.json');

app.use(express.json());
app.use(express.static(path.resolve('public')));

let latestQrDataUrl = null;
let isConnected = false;
let statusMessage = 'Iniciando bot...';

export function getStateData() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    return {
      ...state,
      allowedGroups: config.allowedGroups || [],
      groupNames: config.groupNames || {}
    };
  } catch {
    return { allowedGroups: [], groupNames: {} };
  }
}

io.on('connection', (socket) => {
  socket.emit('status', { connected: isConnected, message: statusMessage });
  socket.emit('state', getStateData());
  
  if (latestQrDataUrl && !isConnected) {
    socket.emit('qr', latestQrDataUrl);
  }
});

export function updateWebStatus(connected, message) {
  isConnected = connected;
  statusMessage = message;
  io.emit('status', { connected, message });
  io.emit('state', getStateData());
}

export function broadcastStateUpdate() {
  io.emit('state', getStateData());
}

export async function updateWebQr(qrString) {
  try {
    latestQrDataUrl = await QRCode.toDataURL(qrString);
    isConnected = false;
    statusMessage = 'Aguardando Leitura de QR Code...';
    io.emit('qr', latestQrDataUrl);
    io.emit('status', { connected: false, message: statusMessage });
  } catch (err) {
    console.error('[Web Server] Erro ao converter QR Code para Imagem:', err);
  }
}

// REST API Endpoints para Prévia Visual no Balão do WhatsApp
app.post('/api/preview/lol', async (req, res) => {
  const articles = await fetchRiotNews();
  const lolArticles = articles.filter(a => !a.title.toLowerCase().includes('tft'));

  if (lolArticles.length > 0) {
    const patchData = await fetchFullPatchSummary(lolArticles[0].url);
    res.json({
      formattedMessage: patchData.formattedMessage || '',
      imageUrl: patchData.imageUrl || ''
    });
  } else {
    const { current } = getNextAndCurrentPatch();
    res.json({
      formattedMessage: `⚔️ *PATCH ATUAL DO LOL: ${current.patch}*\n\nData de Lançamento: *${current.formattedDate}*`,
      imageUrl: ''
    });
  }
});

app.post('/api/preview/ad', async (req, res) => {
  const articles = await fetchRiotNews();
  if (articles.length > 0) {
    const desordemData = await fetchAramDesordemSummary(articles[0].url);
    res.json({
      formattedMessage: desordemData.formattedMessage || '',
      imageUrl: ''
    });
  } else {
    res.json({
      formattedMessage: `💥 *ARAM: DESORDEM*\n\nNenhuma atualização recente de ARAM Desordem no momento.`,
      imageUrl: ''
    });
  }
});

app.post('/api/preview/tft', async (req, res) => {
  const tftArticles = await fetchTftNews();

  if (tftArticles.length > 0) {
    const tftData = await fetchFullPatchSummary(tftArticles[0].url);
    res.json({
      formattedMessage: tftData.formattedMessage || '',
      imageUrl: tftData.imageUrl || ''
    });
  } else {
    res.json({
      formattedMessage: `🎲 *TFT - NOTAS DE ATUALIZAÇÃO*\n\n📜 *PATCH DO TFT*\n\n🔹 *Aprimoramentos*: Balanceamento nos Augments.\n🔹 *Unidades*: Rebalanceamento de taxas de aparição.`,
      imageUrl: ''
    });
  }
});

app.post('/api/trigger-cron', async (req, res) => {
  try {
    const result = await runManualCronCheck();
    res.json({ success: true, message: result });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

export function startWebServer() {
  httpServer.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🌐 DASHBOARD WEB DISPONÍVEL EM: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
}
