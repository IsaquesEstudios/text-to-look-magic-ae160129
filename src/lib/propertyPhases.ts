export type Phase = "purchase" | "renovation" | "sale";

export function phaseFromStatus(status: string | null | undefined): Phase {
  if (status === "renovation_in_progress") return "renovation";
  if (status === "for_sale" || status === "under_contract" || status === "sold") return "sale";
  return "purchase";
}

export interface InvestorTotals {
  userId: string;
  purchase: number;
  renovation: number;
}

export interface InvestorResult extends InvestorTotals {
  total: number;
  pct: number;
  profit: number;
  payout: number;
  roiPct: number;
}

/** lucro = venda − documentação − comissão − total investido; dividido pelo % de cada um no total */
export function computeSaleResults(
  investors: InvestorTotals[],
  saleValue: number,
  docCost: number,
  brokerCommission: number,
) {
  const totalInvested = investors.reduce((a, i) => a + i.purchase + i.renovation, 0);
  const netSale = saleValue - docCost - brokerCommission;
  const profit = netSale - totalInvested;
  const results: InvestorResult[] = investors.map((i) => {
    const total = i.purchase + i.renovation;
    const share = totalInvested > 0 ? total / totalInvested : 0;
    const p = profit * share;
    return { ...i, total, pct: share * 100, profit: p, payout: total + p, roiPct: total > 0 ? (p / total) * 100 : 0 };
  });
  return { totalInvested, netSale, profit, results };
}
