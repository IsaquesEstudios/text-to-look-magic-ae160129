

## Correção do KPI "Total Investido"

### Problema
O cálculo atual soma os custos estimados de todos os projetos (`estimated_auction_value + estimated_renovation_cost`), independente de ter investidor ou não. Isso inflaciona o valor.

### Solução
Alterar o cálculo para refletir o capital real aportado:
- `SUM(shares.amount_paid)` — investimentos vinculados a propriedades
- `SUM(auction_deposits.amount)` — depósitos em leilões

### Arquivos a alterar

1. **`src/pages/Painel.tsx`** — `AdminDashboardContent`, atualizar o cálculo de `totalInvested` na queryFn
2. **`src/pages/painel/AdminDashboardPage.tsx`** — mesmo ajuste no cálculo de `totalInvested`

### Código (ambos os arquivos)
```typescript
// DE:
const totalPropertiesInvested = properties.reduce(
  (acc, p) => acc + Number(p.estimated_auction_value ?? 0) + Number(p.estimated_renovation_cost ?? 0),
  0
);
const auctionInvested = deposits.reduce((acc, d) => acc + Number(d.amount), 0);

// PARA:
const totalSharesInvested = shares.reduce((acc, s) => acc + Number(s.amount_paid), 0);
const auctionInvested = deposits.reduce((acc, d) => acc + Number(d.amount), 0);

// E no return:
totalInvested: totalSharesInvested + auctionInvested,
```

### Resultado
O KPI mostrará apenas o dinheiro efetivamente investido por investidores reais, não estimativas de custo de projeto.

