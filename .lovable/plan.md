

## Taxa de Documentação e Comissão Imobiliária

Nova taxa global (8-12%) sobre o **valor estimado de venda** do imóvel, configurável pelo admin na página de Configurações.

### 1. Criar tabela `system_settings` no banco
- Tabela key-value simples: `key TEXT PRIMARY KEY`, `value TEXT`, `updated_at TIMESTAMPTZ`
- Inserir registro inicial: `key = 'doc_commission_rate'`, `value = '10'` (padrão 10%)
- RLS: admins podem ler/escrever, usuários autenticados podem ler

### 2. Adicionar card na página de Configurações (`AdminConfigPage.tsx`)
- Novo card "Taxa de Documentação e Comissão" abaixo do card de tarifas estaduais
- Campo numérico editável com o valor atual (%)
- Descrição: "Percentual sobre o valor estimado de venda para documentação e comissão da imobiliária"
- Botão salvar que atualiza `system_settings` via `upsert`

### 3. Integrar a taxa nos cálculos financeiros
A taxa incide sobre `estimated_sale_value` e é subtraída do lucro líquido.

**Arquivos afetados:**
- `AdminPropertyForm.tsx` — incluir a taxa no cálculo de ROI: `lucro = venda - totalProjeto - (venda × taxa%)`, buscar taxa via query
- `AuctionPropertyForm.tsx` — mesma lógica de ROI
- `PropertyInvestors.tsx` — exibir a comissão no breakdown do investidor
- `LinkInvestorDialog.tsx` — considerar a taxa no cálculo de retorno do investidor
- `AdminDashboardPage.tsx` — incluir no cálculo de "Valor Discovery"
- `PropertyEditForm.tsx` — recálculo de ROI com a taxa

### 4. Exibir nos cards de métricas financeiras
- Adicionar um 6º card "Doc. & Comissão (Est.)" entre "Valor de Venda" e "Retorno Estimado" nas páginas de detalhe do imóvel
- Valor = `estimated_sale_value × (doc_commission_rate / 100)`

### 5. Hook utilitário
- Criar `useDocCommissionRate()` — query simples que busca o valor de `system_settings` onde `key = 'doc_commission_rate'`, com cache via React Query

### Arquivos criados/alterados
- **Migration SQL** — criar tabela `system_settings` + seed
- `src/hooks/useDocCommissionRate.ts` (novo)
- `src/pages/painel/AdminConfigPage.tsx`
- `src/components/painel/admin/AdminPropertyForm.tsx`
- `src/components/painel/admin/AuctionPropertyForm.tsx`
- `src/components/painel/admin/LinkInvestorDialog.tsx`
- `src/components/painel/property/PropertyInvestors.tsx`
- `src/pages/painel/AdminDashboardPage.tsx`

