-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_publicKey_key" ON "Wallet"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_chatId_key" ON "Wallet"("chatId");
