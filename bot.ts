import dotenv from "dotenv";
dotenv.config();
import TelegramBot from "node-telegram-bot-api";
import {
  handleStartCommand,
  handleHelpCommand,
} from "./services/commandService";
import { getRandomCoinSymbolAndLogo } from "./services/memecoinService";
import {
  createOrGetWallet,
  decrypt,
  getWalletByChatId,
} from "./services/walletService";
import { swapTokens } from "./services/jupiterSwapService";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error(
    "TELEGRAM_BOT_TOKEN is not defined. Please set it in your .env file."
  );
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

interface UserState {
  action: string | "awaitingAmount";
  expectingAmountForSymbol?: string;
  expectingAmountForTokenAddress?: string;
}

interface UserStates {
  [chatId: string]: UserState;
}

let userStates: UserStates = {};

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
    const message = `Discovering a new memecoin: *${symbol}*\nView on [Solscan](${solscanUrl}).`;
    bot.sendPhoto(chatId, logoUrl, {
      caption: message,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👍 Like", callback_data: `like_${symbol}_${tokenAddress}` }, 
            { text: "👎 Pass", callback_data: "pass" },
              ],
        ],
      },
    });
  } else {
    bot.sendMessage(
      chatId,
      "Oops! Looks like we've run out of memecoins to discover. Try again later."
    );
  }
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id.toString();
  if (!chatId || !callbackQuery.data) return;

  if (callbackQuery.data.startsWith("like_")) {
    const dataParts = callbackQuery.data.split("_");
    if (dataParts.length < 3) {
      console.error("Callback data format error:", callbackQuery.data);
      bot.sendMessage(chatId, "An error occurred. Please try again.");
      return;
    }
    const [action, symbol, tokenAddress] = dataParts;

    // Store the expected action, symbol, and token address in the user's state
    userStates[chatId] = {
      action: "awaitingAmount",
      expectingAmountForSymbol: symbol,
      expectingAmountForTokenAddress: tokenAddress,
    };
    bot.sendMessage(
      chatId,
      `You liked ${symbol}! Please enter the amount of SOL you'd like to swap.`
    );
  } else if (callbackQuery.data === "pass") {
    bot.sendMessage(
      chatId,
      "Passed! Discover another memecoin with /discover."
    );
  } else if (callbackQuery.data === "wallet_info") {
    const walletInfo = await createOrGetWallet(chatId.toString());
    if (!walletInfo) {
      bot.sendMessage(
        chatId,
        "Error retrieving wallet information. Please try again."
      );
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
    bot.sendMessage(chatId, walletInfoMessage, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } else if (callbackQuery.data === "discover") {
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
            [
              {
                text: "👍 Like",
                callback_data: `like_${symbol}_${tokenAddress}`,
              },
              { text: "👎 Pass", callback_data: "pass" },
            ],
          ],
        },
      });
    } else {
      bot.sendMessage(
        chatId,
        "Oops! Looks like we've run out of memecoins to discover. Try again later."
      );
    }
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id.toString();
  const text = msg.text || "";
  const userState = userStates[chatId];

  if (userState?.action === "awaitingAmount") {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      bot.sendMessage(chatId, "Please enter a valid amount of SOL to swap.");
      return;
    }

    const walletDetails = await getWalletByChatId(chatId);
    if (!walletDetails) {
      bot.sendMessage(
        chatId,
        "Error retrieving wallet information. Please try again."
      );
      return;
    }

    const decryptedPrivateKey = decrypt(walletDetails.encryptedPrivateKey);
    console.log("Decrypted Private Key:", decryptedPrivateKey);

    const inputMintAddress = "So11111111111111111111111111111111111111112"; // SOL mint address
    const outputMintAddress = userState.expectingAmountForTokenAddress; // Retrieve the stored token address for the memecoin
    const slippageBps = 100;
    const inputTokenDecimals = 9; // SOL decimals

    console.log(userState);

    if (typeof outputMintAddress === "string") {
      const txid = await swapTokens(
        inputMintAddress,
        outputMintAddress,
        amount,
        slippageBps,
        inputTokenDecimals,
        walletDetails.publicKey,
        walletDetails.encryptedPrivateKey
      );

      if (txid) {
        bot.sendMessage(
          chatId,
          `Swap executed successfully! Transaction ID: ${txid}`
        );
      } else {
        bot.sendMessage(chatId, "Failed to execute swap.");
      }
    } else {
      bot.sendMessage(chatId, "Failed to identify the output token address.");
    }
    // Reset the user state
    delete userStates[chatId];
  }
});

console.log("CoinCupid bot is running...");
