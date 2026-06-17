## Problema

No modal "Vincular Investidor", o campo **Reforma (modo %)** está calculando a taxa de forma proporcional à participação no projeto:

```text
taxa = participação × custo_de_reforma × 10%
     = (9.130 / 100.000) × 9.530 × 10%  ≈  $869,57
```

Isso não corresponde à regra real: os **10% são a taxa de serviço cobrada sobre o aporte do investidor**. Com aporte de $10.000, a taxa deveria ser **$1.000** (10% direto sobre o valor investido).

## Mudança

Alterar o cálculo das taxas em **modo %** para incidirem **diretamente sobre o aporte digitado**, e não sobre custos do projeto ponderados por participação:

```text
taxa_reforma (%)  = aporte × (% reforma) / 100   →  10% de 10.000 = $1.000
taxa_vendas (%)   = aporte × (% vendas)  / 100
```

O modo **$ (valor fixo)** continua igual (valor digitado é a taxa).

### Como o aporte/líquido fica

Mantendo a regra atual de que o **aporte digitado = total debitado** (taxas inclusas):

```text
Aporte (debitado)     = $10.000,00
Taxa de reforma (10%) = $1.000,00
Investimento líquido  = $9.000,00
```

Ou seja, `investimento_líquido = aporte − soma_das_taxas`, com as taxas % calculadas sobre o aporte.

## Arquivo afetado

- `src/components/painel/admin/LinkInvestorDialog.tsx`
  - Substituir a fórmula de `kPct` / `netInvestment` baseada em participação por: somar todas as taxas (fixas + %), onde as % incidem sobre `grossAporte`, e definir `netInvestment = grossAporte − somaTaxas`.
  - Ajustar `feeRenovation` e `feeSales` no modo % para `grossAporte * pct / 100` (em vez de `participation * custo * pct / 100`).
  - Recalcular `participation` a partir do novo `netInvestment` para os cálculos de lucro/retorno.
  - Atualizar os textos de dica (hint) para refletir "% sobre o aporte" em vez de "proporcional".

## Detalhes técnicos

- A taxa de **lucro** continua sobre o lucro estimado (não muda).
- A validação `feesExceedAporte` passa a checar se a soma das taxas % + fixas ≥ aporte.
- O resumo da operação continua mostrando Aporte → Taxas → Investimento líquido, agora com os valores novos (ex.: reforma $1.000).