import fs from 'fs';
import path from 'path';

const memecoinsFilePath = path.join(__dirname, '../data/memecoins.json');
const memecoinsList: string[] = JSON.parse(fs.readFileSync(memecoinsFilePath, 'utf8')).memecoins;

export const getRandomCoinSymbol = (): string => {
  const randomIndex = Math.floor(Math.random() * memecoinsList.length);
  return memecoinsList[randomIndex];
};
