

# Correcao e Alinhamento dos KPIs do Dashboard Admin

## Problema Encontrado

O arquivo `src/pages/Painel.tsx` (dashboard principal do admin acessado em `/painel`) **nao foi atualizado** e ainda exibe os 4 KPIs antigos:
- Imoveis, Usuarios, Vinculos, Receita Total

Enquanto `src/pages/painel/AdminDashboardPage.tsx` ja esta correto com os 5 novos KPIs financeiros.

O banco de dados esta correto -- a coluna `service_fee` existe e os dados retroativos foram preenchidos corretamente.

## O que sera feito

### 1. Atualizar `src/pages/Painel.tsx` - AdminDashboardContent

Substituir a query `admin-stats` antiga (que busca properties, profiles, shares) pela nova query que busca:
- `auction_deposits` (amount + service_fee)  
- `properties` (estimated_auction_value, estimated_renovation_cost, estimated_sale_value)

Substituir os 4 cards antigos pelos 5 novos KPIs:

| Card | Dados |
|------|-------|
| Receita Discovery (Taxas) | SUM(auction_deposits.service_fee) |
| Arrecadado em Leiloes | SUM(auction_deposits.amount) |
| Gasto com Arremates | SUM(properties.estimated_auction_value) |
| Custo de Reformas | SUM(properties.estimated_renovation_cost) |
| Receita Estimada de Vendas | SUM(properties.estimated_sale_value) |

Atualizar os imports de icones (remover Building2, PieChart; adicionar DollarSign, Gavel, Hammer, Wrench).

Alterar o grid de `lg:grid-cols-4` para `lg:grid-cols-5`.

### 2. Manter inalterados

- Cards de "Atividade Recente" e "Ultimos Clientes" permanecem como estao
- `AdminDashboardPage.tsx` ja esta correto, nenhuma alteracao necessaria

## Detalhes Tecnicos

Arquivo afetado: `src/pages/Painel.tsx`

Alteracoes:
1. Linha 4: Atualizar imports de icones -- remover `Building2, Users, PieChart` dos KPIs (manter `Users` pois e usado no card "Ultimos Clientes"), adicionar `DollarSign, Gavel, Hammer, Wrench`
2. Linhas 24-39: Substituir a query para buscar `auction_deposits` e `properties` com os campos financeiros
3. Linhas 116-125: Substituir o array de cards pelos 5 novos KPIs com icones corretos
4. Linha 133: Alterar grid para `lg:grid-cols-5`

