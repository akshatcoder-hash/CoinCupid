import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { handleStartCommand, handleHelpCommand } from './services/commandService'
import { getRandomCoinSymbol } from './services/memecoinService';
import { fetchCoinMarketCapInfo } from './services/coinMarketCapService';

// Ensure the TELEGRAM_BOT_TOKEN is specified in the .env file
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
  
            // Inline keyboard markup
            const options : TelegramBot.SendMessageOptions ={
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

console.log("CoinCupid bot is running...");
