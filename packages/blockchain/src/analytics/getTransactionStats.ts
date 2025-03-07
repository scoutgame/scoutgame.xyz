import { prisma } from '@charmverse/core/prisma-client';

export async function getWalletTransactionStats({ address, chainId }: { address: string; chainId: number }) {
  const transactionsByDay = await prisma.$queryRaw<
    {
      date: Date;
      count: number;
      gasCost: string;
    }[]
  >`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count,
      SUM("gasCost") as "gasCost"
    FROM "ScoutProjectWalletTransaction"
    WHERE "walletId" IN (
      SELECT id FROM "ScoutProjectWallet"
      WHERE address = ${address} AND "chainId" = ${chainId}
    )
    GROUP BY DATE("createdAt")
    ORDER BY date
  `;
  return transactionsByDay.map((day) => ({
    day: day.date,
    transactions: Number(day.count),
    accounts: 0,
    gasFees: Number(day.gasCost).toString()
  }));
}

export async function getContractTransactionStats({ address, chainId }: { address: string; chainId: number }) {
  const transactionsByDay = await prisma.$queryRaw<
    {
      day: Date;
      count: number;
      gasCost: string;
    }[]
  >`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count,
      SUM("gasCost") as "gasCost"
    FROM "ScoutProjectContractTransaction"
    WHERE "contractId" IN (
      SELECT id FROM "ScoutProjectContract"
      WHERE address = ${address} AND "chainId" = ${chainId}
    )
    GROUP BY DATE("createdAt")
    ORDER BY date
  `;
  return transactionsByDay.map((day) => ({
    day: day.day,
    transactions: Number(day.count),
    accounts: 0,
    gasFees: Number(day.gasCost).toString()
  }));
}
