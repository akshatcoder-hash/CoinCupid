import { Keypair } from '@solana/web3.js';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY_BASE64 = process.env.ENCRYPTION_KEY || ''; // Assuming it's base64 for AES-256
let encryptionKeyBuffer: Buffer;

try {
    encryptionKeyBuffer = Buffer.from(ENCRYPTION_KEY_BASE64, 'base64');
    if (encryptionKeyBuffer.length !== 32) {
        throw new Error('Key length is not 32 bytes.');
    }
} catch (error) {
    // Using a type assertion
    console.error('Invalid ENCRYPTION_KEY:', (error as Error).message);
    process.exit(1);
}

const IV_LENGTH = 16; // For AES, this is always 16

const encrypt = (text: string) => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-cbc', encryptionKeyBuffer, iv);
    let encrypted = cipher.update(Buffer.from(text, 'utf8'));

    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text: string) => {
    const textParts = text.split(':');
    if (textParts.length < 2) {
        throw new Error("The encrypted data is not in the expected format.");
    }
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv('aes-256-cbc', encryptionKeyBuffer, iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

export const createWallet = () => {
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toBase58();
    const privateKey = Buffer.from(wallet.secretKey).toString('hex');
    const privateKeyEncrypted = encrypt(privateKey);

    const walletData = { publicKey, privateKey: privateKeyEncrypted };
    const walletPath = path.join(__dirname, '../../wallets', `${publicKey}.json`);
    fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));

    return { publicKey, walletDataPath: walletPath };
};

export const getPrivateKey = (publicKey: string): string => {
    const walletPath = path.join(__dirname, '../../wallets', `${publicKey}.json`);
    if (!fs.existsSync(walletPath)) {
        throw new Error('Wallet not found.');
    }

    const { privateKey } = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    return decrypt(privateKey);
};

export const getDecryptedPrivateKey = async (publicKey: string): Promise<string> => {
    const walletPath = path.join(__dirname, '../../wallets', `${publicKey}.json`);
    if (!fs.existsSync(walletPath)) {
        throw new Error('Wallet not found.');
    }

    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const decryptedPrivateKey = decrypt(walletData.privateKey); // Use the existing decrypt function
    return decryptedPrivateKey;
};

export const getWalletInfo = (chatId: string) => {
    const walletPath = path.join(__dirname, '../../wallets', `${chatId}.json`);
    if (fs.existsSync(walletPath)) {
        const { publicKey } = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        return { publicKey };
    }
    return null;
};

export const createOrGetWallet = (chatId: string) => {
    const walletsDir = path.join(__dirname, '../../wallets');
    const walletPath = path.join(walletsDir, `${chatId}.json`);

    // Ensure the wallets directory exists
    if (!fs.existsSync(walletsDir)) {
        fs.mkdirSync(walletsDir, { recursive: true });
    }

    // Check if the wallet already exists
    if (fs.existsSync(walletPath)) {
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        return { publicKey: walletData.publicKey, isNew: false };
    }

    // If not, create a new wallet
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toBase58();
    const privateKey = Buffer.from(wallet.secretKey).toString('hex');
    const privateKeyEncrypted = encrypt(privateKey);

    // Save the new wallet info
    fs.writeFileSync(walletPath, JSON.stringify({ publicKey, privateKey: privateKeyEncrypted }, null, 2));

    return { publicKey, isNew: true };
};
