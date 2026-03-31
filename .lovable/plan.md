

## Dados fictícios exclusivos para conta demo

### Abordagem
Criar um módulo de **dados mock client-side** (`src/data/demoData.ts`) que é injetado apenas quando `isDemoUser === true`. Isso evita inserir dados reais no banco (que seriam visíveis ao admin e outros usuários).

### O que o usuário demo verá

1. **1 Leilão ativo** — com countdown longo (ex: data de encerramento em 2027), contendo 1 item de imóvel com estimativas financeiras
2. **1 Imóvel (casa)** — vinculado ao demo, com novidades (mensagens) e gastos simulados
3. **1 Terreno (land)** — vinculado ao demo, com novidades e gastos simulados
4. **Dashboard** — KPIs refletindo os investimentos fictícios, atividade recente e cards de propriedade com badges de notificação

### Arquivos criados/alterados

**1. `src/data/demoData.ts`** (novo)
- Exporta constantes: `DEMO_AUCTION`, `DEMO_AUCTION_ITEMS`, `DEMO_PROPERTIES` (1 house + 1 land), `DEMO_SHARES`, `DEMO_MESSAGES`, `DEMO_EXPENSES`, `DEMO_CREDIT_TRANSACTIONS`
- IDs fixos com prefixo `demo-` para evitar colisão com UUIDs reais
- Valores financeiros realistas (ex: arremate $35k, reforma $25k, venda estimada $95k)

**2. `src/components/painel/UserDashboard.tsx`**
- Quando `isDemoUser`: substituir os dados de `shares`, `recentActivity` e `propertyNews` pelos mocks
- Os KPIs (crédito, investido, retorno, ROI) refletirão os dados demo

**3. `src/pages/painel/UserLeiloesPage.tsx`**
- Quando `isDemoUser`: injetar `DEMO_AUCTION` na lista de leilões e `DEMO_AUCTION_ITEMS` nos itens

**4. `src/pages/painel/UserPropriedadesPage.tsx`**
- Quando `isDemoUser`: injetar `DEMO_SHARES` nos shares retornados pela query

**5. `src/pages/painel/UserImoveis.tsx`**
- Quando `isDemoUser`: injetar shares demo filtradas por type=house

**6. `src/pages/painel/UserTerrenosPage.tsx`**
- Quando `isDemoUser`: injetar shares demo filtradas por type=land

**7. Páginas de detalhe do imóvel** (`PropertyNovidadesPage`, `PropertyGastosPage`)
- Quando `isDemoUser` e o property_id começa com `demo-`: renderizar mensagens e gastos mockados do `demoData.ts` em vez de buscar do banco

**8. Rota de detalhe do imóvel** (verificar `PropertySubNav`, guards de acesso)
- Permitir acesso a IDs `demo-*` sem consulta ao banco quando `isDemoUser`

### Princípio de isolamento
- Nenhum dado é inserido no banco de dados
- Toda lógica condicional usa `isDemoUser` do `useAuth`
- Admin e outros usuários nunca veem esses dados pois a condição `isDemoUser` só é verdadeira para `demo@discoveryinvestimentos.com`

