import { fetchCoinMarketCapInfo, CoinDetail } from './coinMarketCapService'; 
import fs from 'fs';
import path from 'path';

// Load symbols from memecoins.json
const memecoinsFilePath = path.join(__dirname, '../data/memecoins.json');
const symbols: string[] = JSON.parse(fs.readFileSync(memecoinsFilePath, 'utf8')).symbols;

// Tracks which memecoins have been shown to each user (by chatId)
const shownMemecoins: { [chatId: string]: Set<string> } = {};

// Returns a random memecoin symbol and its logo URL, ensuring it hasn't been shown to the user
export const getRandomCoinSymbolAndLogo = async (chatId: string): Promise<{ symbol: string; logoUrl: string; tokenAddress: string } | null> => {
  if (!shownMemecoins[chatId]) shownMemecoins[chatId] = new Set();

  const unshownSymbols = symbols.filter(symbol => !shownMemecoins[chatId].has(symbol));
  if (unshownSymbols.length === 0) {
    console.log("All memecoins have been shown.");
    return null; // All memecoins have been shown
  }

  const randomIndex = Math.floor(Math.random() * unshownSymbols.length);
  const selectedSymbol = unshownSymbols[randomIndex];
  shownMemecoins[chatId].add(selectedSymbol);

  // Fetch the memecoin information from CoinMarketCap
  const coinDetails = await fetchCoinMarketCapInfo(selectedSymbol);
  if (!coinDetails || coinDetails.length === 0) {
    console.error(`No data found for symbol ${selectedSymbol}`);
    return null;
  }

  // Find the Solana platform entry
  const solanaCoinDetail = coinDetails.find(detail => detail.platform?.name === "Solana");
  if (!solanaCoinDetail) {
    console.error(`Solana token address not found for symbol ${selectedSymbol}`);
    return null;
  }

  const logoUrl = solanaCoinDetail.logo;
  const tokenAddress = solanaCoinDetail.platform?.token_address;

  return tokenAddress ? { symbol: selectedSymbol, logoUrl, tokenAddress } : null;
};
