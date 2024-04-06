import { Message } from "node-telegram-bot-api";
import TelegramBot from "node-telegram-bot-api";

export const handleStartCommand = (msg: Message, bot: TelegramBot) => {
  const chatId = msg.chat.id;
  const response = `💘 Welcome to CoinCupid! 💘
Find your perfect memecoin match with a swipe!

Here's how to get started:
1. 💸 Send some SOL to your CoinCupid wallet to begin.
2. 💖 Swipe right (👍) on a memecoin to "like" and buy, or swipe left (👎) to pass.
3. 🔄 Refresh your balance anytime to see your new matches and holdings.

Ready to find your first memecoin match? Tap 'Discover' to begin!

For wallet info and private key retrieval, please use the 'Wallet' feature with caution.`;
  bot.sendMessage(chatId, response);
};

export const handleHelpCommand = (msg: Message, bot: TelegramBot) => {
  const chatId = msg.chat.id;
  const response = `Need a hand finding your crypto crush? Here’s how I can help:
/start - Begin your CoinCupid journey.
/discover - Explore and match with memecoins.
/wallet - View your wallet and manage your assets.
/help - You're looking at it! 😉
    
Swipe right on love, left on the rest. Your crypto match awaits!`;
  bot.sendMessage(chatId, response);
};
