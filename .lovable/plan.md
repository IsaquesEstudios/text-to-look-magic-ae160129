

# Melhorias no Painel do Investidor

## 1. Corrigir bug de calculo em "Meus Imoveis" (UserImoveis.tsx)

A pagina usa `purchase_price` e `estimated_return_pct` para calcular valores. Sera atualizada para usar a formula correta:
- **Total do Projeto** = `estimated_auction_value` + `estimated_renovation_cost`
- **Valor de Venda** = `estimated_sale_value`
- **ROI** = `((Venda - Total) / Total) * 100`
- **Retorno estimado do usuario** = participacao proporcional sobre a margem de lucro

## 2. Resumo do portfolio no Dashboard (UserDashboard.tsx)

Adicionar dois novos KPIs na grade de estatisticas do dashboard, calculados a partir dos `shares` e `properties`:
- **Total Investido**: soma de todos os `amount_paid` do usuario
- **Retorno Estimado Total**: soma dos retornos proporcionais de cada imovel

Substituir o card generico "Leiloes" por esses dois KPIs mais uteis, mantendo o link para leiloes em outro local.

## 3. Porcentagem de participacao nos cards de imoveis

Em **UserImoveis.tsx**, exibir a % de participacao do usuario em cada imovel (calculado como `totalPaid / totalProject * 100`).

Em **UserLeiloesPage.tsx**, nos cards de imoveis onde o usuario tem depositos, mostrar a participacao relativa.

## 4. Extrato mais descritivo

No **UserDashboard.tsx**, melhorar os titulos do historico recente para incluir o tipo `refund` como "Estorno" e exibir valores negativos/positivos com cores distintas.

---

### Detalhes tecnicos

**Arquivo: `src/pages/painel/UserImoveis.tsx`**
- Linhas 76-80: substituir calculo por formula dinamica usando `estimated_auction_value`, `estimated_renovation_cost`, `estimated_sale_value`
- Linha 132-134: atualizar badge de ROI
- Adicionar badge com % de participacao

**Arquivo: `src/components/painel/UserDashboard.tsx`**
- Linhas 133-134: calcular `totalInvested` e `totalEstimatedReturn` a partir dos shares
- Linhas 157-191: reorganizar grid de KPIs para incluir Total Investido e Retorno Estimado
- Linhas 40-47: adicionar mapeamento para tipo `refund` -> "Estorno" e colorir valores

