import { Message } from "node-telegram-bot-api";
import TelegramBot from "node-telegram-bot-api";
import { createOrGetWallet } from "./walletService";

export const handleStartCommand = async (msg: Message, bot: TelegramBot) => {
    const chatId = msg.chat.id;
    // Ensure createOrGetWallet is awaited since it might perform async operations
    const { publicKey, isNew } = await createOrGetWallet(chatId.toString());

    let response = `Welcome to CoinCupid! 💘\n`;

    if (isNew) {
        response += `I've created a new wallet for you! **Your wallet address is**: \`${publicKey}\`\n`;
    } else {
        response += `You already have a wallet! **Your wallet address is**: \`${publicKey}\`\n`;
    }

    response += `💸 Send some SOL to your CoinCupid wallet to begin.\n`;
    response += `💖 Swipe right (👍) on a memecoin to "like" and buy, or swipe left (👎) to pass.\n`;
    response += `🔄 Refresh your balance anytime to see your new matches and holdings.\n\n`;
    response += `Ready to find your first memecoin match? Tap 'Discover' to begin!\n\n`;
    response += `For wallet info and private key retrieval, please use the 'Wallet' feature with caution.`;

    // Inline keyboard markup for Discover and Wallet Info buttons
    const options : TelegramBot.SendMessageOptions ={
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Discover', callback_data: 'discover' }, // "Discover" button
                    { text: 'Wallet Info', callback_data: 'wallet_info' } // "Wallet Info" button
                ]
            ]
        }
    };

    bot.sendMessage(chatId, response, options);
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
