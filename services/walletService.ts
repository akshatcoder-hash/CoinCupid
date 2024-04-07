import { Keypair } from '@solana/web3.js';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const ENCRYPTION_KEY_BASE64 = process.env.ENCRYPTION_KEY || '';
let encryptionKeyBuffer: Buffer;

try {
    encryptionKeyBuffer = Buffer.from(ENCRYPTION_KEY_BASE64, 'base64');
    if (encryptionKeyBuffer.length !== 32) {
        throw new Error('Key length is not 32 bytes.');
    }
} catch (error) {
    console.error('Invalid ENCRYPTION_KEY:', (error as Error).message);
    process.exit(1);
}

const IV_LENGTH = 16; // For AES, this is always 16

const encrypt = (text: string): string => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-cbc', encryptionKeyBuffer, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    const decipher = createDecipheriv('aes-256-cbc', encryptionKeyBuffer, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

export const createWalletForUser = async (chatId: string): Promise<{ publicKey: string; encryptedPrivateKey: string }> => {
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toBase58();
    const privateKey = Buffer.from(wallet.secretKey).toString('hex');
    const encryptedPrivateKey = encrypt(privateKey);
  
    // Save the new wallet to the database
    await prisma.wallet.create({
      data: {
        publicKey, 
        encryptedPrivateKey, 
        chatId 
      }
    });
  
    return { publicKey, encryptedPrivateKey };
};
  
export const getWalletByChatId = async (chatId: string): Promise<{ publicKey: string; encryptedPrivateKey: string } | null> => {
    const wallet = await prisma.wallet.findUnique({
      where: {
        chatId 
      }
    });
  
    if (wallet) {
      return {
        publicKey: wallet.publicKey, 
        encryptedPrivateKey: wallet.encryptedPrivateKey 
      };
    } else {
      return null;
    }
};

export const createOrGetWallet = async (chatId: string): Promise<{ publicKey: string; encryptedPrivateKey: string; isNew: boolean }> => {
    let wallet = await getWalletByChatId(chatId);
  
    if (wallet) {
      return { ...wallet, isNew: false };
    } else {
      wallet = await createWalletForUser(chatId);
      return { ...wallet, isNew: true };
    }
};
