import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/hydrophobis/ClashCards/main/img';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3001/api/cards';
const OUTPUT_FILE = './cards.json';
const IMG_DIR = path.join(__dirname, 'img');

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Warning: Failed to download ${url} (HTTP ${res.status}). Skipping.`);
      return false;
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(filename, Buffer.from(buffer));
    return true;
  } catch (err) {
    console.warn(`Warning: Error downloading ${url}: ${err.message}. Skipping.`);
    return false;
  }
}

async function fetchAndSaveCards() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const data = json.items || [];

    const playableCards = [];

    for (const card of data) {
      if (card.elixirCost === undefined || !card.rarity || !card.name) continue;

      const imageUrl = card.iconUrls?.medium || card.iconUrls?.evolutionMedium;
      let finalImageUrl = imageUrl;

      if (imageUrl) {
        const imgFilename = path.join(IMG_DIR, `${card.id}.png`);
        const downloaded = await downloadImage(imageUrl, imgFilename);
        if (downloaded) finalImageUrl = `${GITHUB_RAW_BASE}/${card.id}.png`;
      }

      playableCards.push({
        ...card,
        elixir: card.elixirCost,
        imageUrl: finalImageUrl
      });

      if (card.maxEvolutionLevel) {
        const evoImgUrl = card.iconUrls?.evolutionMedium || imageUrl;
        let evoFinalUrl = evoImgUrl;

        if (evoImgUrl) {
          const evoFilename = path.join(IMG_DIR, `${card.id}-evo.png`);
          const downloaded = await downloadImage(evoImgUrl, evoFilename);
          if (downloaded) evoFinalUrl = `${GITHUB_RAW_BASE}/${card.id}-evo.png`;
        }

        playableCards.push({
          ...card,
          name: `Evo ${card.name}`,
          elixir: card.elixirCost,
          imageUrl: evoFinalUrl
        });
      }
    }

    playableCards.sort((a, b) => b.elixir - a.elixir || a.name.localeCompare(b.name));
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(playableCards, null, 2));
    console.log(`Saved ${playableCards.length} cards and processed images to ./img`);
  } catch (err) {
    console.error('Error fetching or saving cards:', err);
  }
}

fetchAndSaveCards();
