import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import bs58 from 'bs58';
import { decrypt } from './walletService';

const connection = new Connection('https://api.devnet.solana.com');

const getSwapQuote = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
): Promise<any | null> => {
  try {
    const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return null;
  }
};

const executeSwap = async (
  quoteResponse: any,
  userPublicKey: string,
  encryptedPrivateKey: string
): Promise<string | null> => {
  try {
    const decryptedPrivateKey = decrypt(encryptedPrivateKey);
    const keypair = Keypair.fromSecretKey(bs58.decode(decryptedPrivateKey));

    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
      }),
    });

    const { swapTransaction } = await swapResponse.json();

    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    transaction.sign([keypair]);

    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });
    await connection.confirmTransaction(txid);

    return txid;
  } catch (error) {
    console.error('Error executing swap:', error);
    return null;
  }
};

const calculateSwapAmount = (amount: number, inputDecimals: number): number => {
  return amount * Math.pow(10, inputDecimals);
};

export const swapTokens = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number,
  inputDecimals: number,
  userPublicKey: string,
  encryptedPrivateKey: string
): Promise<string | null> => {
  const swapAmount = calculateSwapAmount(amount, inputDecimals);

  const quoteResponse = await getSwapQuote(inputMint, outputMint, swapAmount, slippageBps);
  if (!quoteResponse) {
    console.error('Failed to get swap quote.');
    return null;
  }

  const txid = await executeSwap(quoteResponse, userPublicKey, encryptedPrivateKey);
  if (!txid) {
    console.error('Swap execution failed.');
    return null;
  }

  return txid;
};