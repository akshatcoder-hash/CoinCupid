// src/services/walletService.ts
import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

export const createWallet = () => {
    const wallet = Keypair.generate();

    const publicKey = wallet.publicKey.toString();
    const privateKey = wallet.secretKey.toString();

    const walletPath = path.join(__dirname, '../../wallets', `${publicKey}.json`);
    fs.writeFileSync(walletPath, JSON.stringify({ publicKey, privateKey }, null, 2));

    return { publicKey, privateKey };
};
