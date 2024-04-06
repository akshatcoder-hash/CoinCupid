import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { handleStartCommand, handleHelpCommand } from './services/commandService';
import { getRandomCoinSymbol } from './services/memecoinService';
import { fetchCoinMarketCapInfo } from './services/coinMarketCapService';
import { createOrGetWallet } from './services/walletService'; // Make sure this is implemented

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not defined. Please set it in your .env file.");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Command: Start
bot.onText(/\/start/, (msg) => {
  handleStartCommand(msg, bot);
});

// Command: Help
bot.onText(/\/help/, (msg) => {
  handleHelpCommand(msg, bot);
});

// Command: Discover
bot.onText(/\/discover/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const symbol = getRandomCoinSymbol(); // Ensure this method is implemented to fetch a random symbol
        const coinDetails = await fetchCoinMarketCapInfo(symbol);
  
        if (coinDetails && coinDetails.length > 0) {
            const detail = coinDetails[0]; // Taking the first result
            let message = `*${detail.name} (${detail.symbol})*\n\n${detail.description}\n`;
  
            // Inline keyboard markup for Like and Pass
            const options: TelegramBot.SendMessageOptions = {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '👍 Like', callback_data: `like_${detail.symbol}` },
                            { text: '👎 Pass', callback_data: `pass` }
                        ]
                    ]
                }
            };
  
            bot.sendMessage(chatId, message, options);
        } else {
            bot.sendMessage(chatId, "Sorry, I couldn't find that coin. Try another one!");
        }
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Oops! Something went wrong. Please try again later.");
    }
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId || !callbackQuery.data) return;

    // Handle Like and Pass
    if (callbackQuery.data.startsWith('like_')) {
        const symbol = callbackQuery.data.split('_')[1];
        bot.sendMessage(chatId, `You liked ${symbol}! //TODO: Implement swap logic here.`);
    } else if (callbackQuery.data === 'pass') {
        bot.sendMessage(chatId, "Passed! Discover another memecoin with /discover.");
    }
    // Handle Wallet Info
    else if (callbackQuery.data === 'wallet_info') {
        const { publicKey } = await createOrGetWallet(chatId.toString());
        const solscanUrl = `https://solscan.io/account/${publicKey}`;
        const walletInfoResponse = `Your wallet address is: \`${publicKey}\`\n[View on Solscan](${solscanUrl})`;
        bot.sendMessage(chatId, walletInfoResponse, { parse_mode: 'Markdown' });
    }
});

console.log("CoinCupid bot is running...");
