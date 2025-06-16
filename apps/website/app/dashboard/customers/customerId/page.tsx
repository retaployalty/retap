"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Transaction {
  id: string;
  points: number;
  created_at: string;
  merchant_id: string;
}

interface RedeemedReward {
  id: string;
  reward_id: string;
  reward_name: string;
  points_spent: number;
  redeemed_at: string;
  status: string;
}

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const supabase = createClientComponentClient();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<RedeemedReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Storico transazioni
      const { data: txs } = await supabase.rpc("get_customer_transactions", { p_customer_id: customerId });
      setTransactions(txs || []);
      // Premi riscattati
      const { data: rds } = await supabase.rpc("get_customer_redeemed_rewards", { p_customer_id: customerId });
      setRewards(rds || []);
      setLoading(false);
    }
    if (customerId) loadData();
  }, [customerId, supabase]);

  if (loading) return <div>Caricamento...</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Dettaglio Cliente</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Storico Transazioni</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Punti</th>
              <th>Merchant</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                <td>{tx.points}</td>
                <td>{tx.merchant_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Premi Riscattati</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Premio</th>
              <th>Punti spesi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map(rw => (
              <tr key={rw.id}>
                <td>{new Date(rw.redeemed_at).toLocaleDateString()}</td>
                <td>{rw.reward_name}</td>
                <td>{rw.points_spent}</td>
                <td>{rw.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
