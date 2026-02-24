
# Reformulacao dos KPIs do Dashboard Admin

## Objetivo
Substituir os cards atuais (Imoveis, Usuarios, Vinculos, Receita Total) por 5 novos KPIs financeiros que refletem a saude real do negocio, com titulos auto-descritivos.

## Novos KPIs (Cards)

| # | Titulo | Descricao | Fonte dos dados |
|---|--------|-----------|-----------------|
| 1 | **Receita Discovery (Taxas)** | Total ganho pelo admin em taxas de servico | Nova coluna `service_fee` na tabela `auction_deposits` |
| 2 | **Arrecadado em Leiloes** | Soma de todos os depositos de participacao em leiloes | `SUM(auction_deposits.amount)` |
| 3 | **Gasto com Arremates** | Quanto ja foi gasto arrematando imoveis | `SUM(properties.estimated_auction_value)` |
| 4 | **Custo de Reformas** | Total previsto em reformas de todos os imoveis | `SUM(properties.estimated_renovation_cost)` |
| 5 | **Receita Estimada de Vendas** | Quanto sera arrecadado ao vender todos os imoveis | `SUM(properties.estimated_sale_value)` |

## Detalhes Tecnicos

### 1. Migracao no banco de dados

Adicionar coluna `service_fee` na tabela `auction_deposits` para registrar a taxa cobrada em cada deposito:

```sql
ALTER TABLE auction_deposits ADD COLUMN service_fee numeric NOT NULL DEFAULT 0;
```

Atualizar a funcao `process_auction_deposit` para calcular e salvar a taxa automaticamente:
- Deposito de $800 a $10.999 -> taxa de $500 (Terreno)
- Deposito de $11.000+ -> taxa de $5.000 (Casa)

Preencher retroativamente os depositos existentes com as taxas corretas.

### 2. Atualizar `src/pages/Painel.tsx`

- Substituir a query `admin-stats` para buscar:
  - `auction_deposits` (amount + service_fee)
  - `properties` (estimated_auction_value, estimated_renovation_cost, estimated_sale_value)
- Substituir os 4 cards atuais pelos 5 novos KPIs
- Usar icones distintos para cada card (DollarSign, Gavel, Hammer, Wrench, TrendingUp)
- Manter os cards de "Atividade Recente" e "Ultimos Clientes" inalterados

### 3. Atualizar `src/pages/painel/AdminDashboardPage.tsx`

Aplicar as mesmas mudancas de KPIs para manter consistencia (este arquivo tambem tem um dashboard admin).
