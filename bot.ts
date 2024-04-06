import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { handleStartCommand, handleHelpCommand } from './services/commandService'

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

console.log("CoinCupid bot is running...");
