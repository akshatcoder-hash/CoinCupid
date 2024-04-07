import dotenv from "dotenv";
dotenv.config();
import TelegramBot from "node-telegram-bot-api";
import { handleStartCommand, handleHelpCommand } from "./services/commandService";
import { getRandomCoinSymbolAndLogo } from "./services/memecoinService";
import { createOrGetWallet, decrypt } from "./services/walletService";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not defined. Please set it in your .env file.");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    handleStartCommand(msg, bot);
});

bot.onText(/\/help/, (msg) => {
    handleHelpCommand(msg, bot);
});

bot.onText(/\/discover/, async (msg) => {
    const chatId = msg.chat.id;
    const memecoinInfo = await getRandomCoinSymbolAndLogo(chatId.toString());
    if (memecoinInfo) {
        const { symbol, logoUrl, tokenAddress } = memecoinInfo;
        const solscanUrl = `https://solscan.io/token/${tokenAddress}`;
        const message = `Discovering a new memecoin: *${symbol}*\nView on [Solscan](${solscanUrl}).`;        bot.sendPhoto(chatId, logoUrl, {
            caption: message,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "👍 Like", callback_data: `like_${symbol}` }, { text: "👎 Pass", callback_data: "pass" }],
                ],
            },
        });
    } else {
        bot.sendMessage(chatId, "Oops! Looks like we've run out of memecoins to discover. Try again later.");
    }
});

bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId || !callbackQuery.data) return;

    if (callbackQuery.data.startsWith("like_")) {
        const symbol = callbackQuery.data.split("_")[1];
        bot.sendMessage(chatId, `You liked ${symbol}! //todo: Implement swap logic here.`);
    } else if (callbackQuery.data === "pass") {
        bot.sendMessage(chatId, "Passed! Discover another memecoin with /discover.");
    } else if (callbackQuery.data === "wallet_info") {
        const walletInfo = await createOrGetWallet(chatId.toString());
        if (!walletInfo) {
            bot.sendMessage(chatId, "Error retrieving wallet information. Please try again.");
            return;
        }
        const decryptedPrivateKey = decrypt(walletInfo.encryptedPrivateKey);
        const solscanUrl = `https://solscan.io/account/${walletInfo.publicKey}`;
        const walletInfoMessage = `
*Your Wallet Information:*\n
- Public Address: \`${walletInfo.publicKey}\`
- *Private Key: \`${decryptedPrivateKey}\`* \n 
(🚨*Warning*: Never share your private key!)\n
[View on Solscan](${solscanUrl})

🔒 Keep your private key secure. Only you should have access to this information.
        `;
        bot.sendMessage(chatId, walletInfoMessage, { parse_mode: "Markdown", disable_web_page_preview: true });
    }

    else if (callbackQuery.data === "discover") {
      // New handler logic as described in the previous message
      const memecoinInfo = await getRandomCoinSymbolAndLogo(chatId.toString());
      if (memecoinInfo) {
          const { symbol, logoUrl, tokenAddress } = memecoinInfo;
          console.log(tokenAddress);
          const solscanUrl = `https://solscan.io/token/${tokenAddress}`;
          const message = `Discovering a new memecoin: *${symbol}*, \n View on SolanaFM:(${solscanUrl})`;
          bot.sendPhoto(chatId, logoUrl, {
              caption: message,
              parse_mode: "Markdown",
              reply_markup: {
                  inline_keyboard: [
                      [{ text: "👍 Like", callback_data: `like_${symbol}` }, { text: "👎 Pass", callback_data: "pass" }],
                  ],
              },
          });
      } else {
          bot.sendMessage(chatId, "Oops! Looks like we've run out of memecoins to discover. Try again later.");
      }
  }

});

console.log("CoinCupid bot is running...");
