import fetch from 'node-fetch';

export interface CoinMarketCapApiResponse {
  data: { [key: string]: CoinDetail[] }; // Since a symbol can map to multiple coins
  status: Status;
}

export interface CoinDetail {
  id: number;
  name: string;
  symbol: string;
  category: string;
  description: string;
  slug: string;
  logo: string;
  tags: string[];
  urls: Urls;
}

export interface Urls {
  website: string[];
  technical_doc: string[];
  twitter: string[];
  reddit: string[];
  message_board: string[];
  announcement: string[];
  chat: string[];
  explorer: string[];
  source_code: string[];
}

export interface Status {
  timestamp: string;
  error_code: number;
  error_message?: string;
  elapsed: number;
  credit_count: number;
}

const API_URL = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/info';
const API_KEY = process.env.COINMARKETCAP_API_KEY;

export const fetchCoinMarketCapInfo = async (symbol: string): Promise<CoinDetail[] | null> => {
    if (!API_KEY) {
      console.error('CoinMarketCap API key is not defined');
      return null;
    }
  
    const params = new URLSearchParams({ symbol });
    const url = `${API_URL}?${params}`;
  
    try {
      const response = await fetch(url, {
        headers: { 'X-CMC_PRO_API_KEY': API_KEY },
      });
  
      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
      }
  
      // HACK: Use a type assertion here to specify the response is of type CoinMarketCapApiResponse
      const jsonResponse = (await response.json()) as CoinMarketCapApiResponse;
  
      // Check if there's an array for the symbol and it's not empty
      if (jsonResponse.data && jsonResponse.data[symbol.toUpperCase()] && jsonResponse.data[symbol.toUpperCase()].length > 0) {
        return jsonResponse.data[symbol.toUpperCase()];
      } else {
        console.error(`No data found for symbol ${symbol}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to fetch data from CoinMarketCap for symbol ${symbol}:`, error);
      return null;
    }
  };
  