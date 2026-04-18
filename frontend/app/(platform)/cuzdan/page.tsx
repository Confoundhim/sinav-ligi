"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

import { depositWallet, getTransactions, getWallet } from "@/lib/api/wallet";
import type { Transaction, Wallet as WalletType } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TYPE_LABELS: Record<string, string> = {
  deposit: "Yükleme",
  purchase: "Satın Alma",
  reward: "Ödül",
};

const TYPE_COLORS: Record<string, string> = {
  deposit: "text-emerald-400",
  purchase: "text-destructive",
  reward: "text-accent",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CuzdanPage() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [w, tx] = await Promise.all([getWallet(), getTransactions()]);
      setWallet(w);
      setTransactions(tx);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cüzdan yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount < 1) {
      toast.error("Geçerli bir tutar girin");
      return;
    }
    setDepositing(true);
    try {
      await depositWallet(amount);
      toast.success(`${amount} TL yüklendi`);
      setDepositAmount("");
      setShowDeposit(false);
      void fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setDepositing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Ekonomi"
        title="Cüzdan"
        description="Bakiyeni yönet, jetonlarını harca ve ödüllerini takip et."
        badge="Rewards"
        action={
          <Button
            onClick={() => setShowDeposit((v) => !v)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <PlusCircle className="size-4" />
            Bakiye Yükle
          </Button>
        }
      />

      {/* Deposit form */}
      {showDeposit && (
        <div className="arena-shell border-border/70 p-5">
          <h2 className="mb-4 font-semibold">Bakiye Yükle</h2>
          <form onSubmit={handleDeposit} className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Tutar (TL)"
              className="border-border/70 bg-secondary/55 h-10 rounded-xl"
              disabled={depositing}
            />
            <Button
              type="submit"
              disabled={depositing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              {depositing ? "Yükleniyor…" : "Yükle"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeposit(false)}
            >
              İptal
            </Button>
          </form>
        </div>
      )}

      {/* Balance card */}
      <Card className="arena-shell border-border/70">
        <CardContent className="flex items-center gap-5 p-6">
          <div className="bg-primary/14 text-primary flex size-16 items-center justify-center rounded-2xl">
            <Wallet className="size-7" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Mevcut Bakiye</p>
            {loading ? (
              <p className="text-muted-foreground mt-1 text-2xl font-semibold">
                —
              </p>
            ) : (
              <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
                {wallet?.balance.toLocaleString("tr-TR") ?? 0}{" "}
                <span className="text-muted-foreground text-lg font-normal">
                  {wallet?.currency ?? "TL"}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="arena-shell border-border/70">
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Yükleniyor…
            </p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Henüz işlem yok
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="leaderboard-row justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tx.description}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`text-sm font-semibold ${TYPE_COLORS[tx.type] ?? ""}`}
                    >
                      {tx.type === "purchase" ? "-" : "+"}
                      {Math.abs(tx.amount).toLocaleString("tr-TR")} TL
                    </span>
                    <Badge className="bg-secondary text-muted-foreground text-xs">
                      {TYPE_LABELS[tx.type] ?? tx.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
