import { Keypair } from '@solana/web3.js';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // this is 32 bytes for AES-256
if (ENCRYPTION_KEY === '' || ENCRYPTION_KEY.length !== 32) {
    console.error('Invalid ENCRYPTION_KEY length. Ensure it is 32 bytes.');
    process.exit(1);
}

const IV_LENGTH = 16; // For AES, this is always 16

const encrypt = (text: string) => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);

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
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

export const createWallet = () => {
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toString();
    const privateKey = wallet.secretKey.toString();
    const privateKeyEncrypted = encrypt(privateKey);

    //REVIEW: use a secure database or something in prod
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

export const getWalletInfo = (chatId: string) => {
    const walletPath = path.join(__dirname, '../../wallets', `${chatId}.json`);
    if (fs.existsSync(walletPath)) {
        const { publicKey } = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        return { publicKey };
    }
    return null;
};