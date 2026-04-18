import { apiRequest } from "./client";
import type { Transaction, Wallet } from "./types";

export async function getWallet(): Promise<Wallet> {
  return apiRequest<Wallet>("/wallet");
}

export async function depositWallet(amount: number): Promise<void> {
  await apiRequest<void>("/wallet/deposit", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getTransactions(): Promise<Transaction[]> {
  return apiRequest<Transaction[]>("/wallet/transactions");
}
