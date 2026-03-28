

# Planos de Investimento por Investidor — 4 Opções de Taxação

## Resumo

Cada investidor vinculado a um imóvel poderá ter um plano de taxação diferente. O admin escolhe o plano ao vincular, dentro de um popup/dialog com busca por nome.

## As 4 Opções

| Plano | Código | Taxa Arremate | Taxa Reforma | Divisão Lucros |
|-------|--------|--------------|-------------|----------------|
| 1 | `standard` | $5.000 (casa) / $500 (terreno) | 10% do valor da reforma | 70% invest / 30% Discovery |
| 2 | `equal_split` | $0 | $0 | 50% / 50% |
| 3 | `fixed_12` | $0 | $0 | 12% fixo ao investidor |
| 4 | `fixed_15` | $0 | $0 | 15% fixo ao investidor |

## Ponto de Decisão Importante

**Opção 1 — Taxa de reforma de 10%**: Essa taxa é **nova** no sistema. Hoje só existe a taxa de arremate ($5.000/$500). Preciso confirmar:
- Os 10% sobre o valor estimado de reforma devem ser debitados dos créditos do investidor **no ato da vinculação** (proporcionalmente à participação)?  
- Exemplo: imóvel com reforma estimada de $50.000, investidor vincula 50% → taxa de reforma = 10% × $50.000 × 50% = $2.500 debitado além do investimento e da taxa de arremate?

## Alterações Técnicas

### 1. Banco de Dados (migração)

- Adicionar coluna `investment_plan text NOT NULL DEFAULT 'standard'` na tabela `shares`
- Atualizar RPC `admin_link_investor_to_property`:
  - Receber novo parâmetro `p_investment_plan`
  - Se `standard`: cobrar taxa arremate proporcional + taxa reforma 10% proporcional
  - Se `equal_split`, `fixed_12`, `fixed_15`: zero taxas, debitar apenas o valor investido
  - Salvar o plano na coluna `investment_plan` do share criado
- Atualizar RPC `admin_unlink_investor`:
  - Ler o `investment_plan` de cada share ao calcular estorno
  - Se `standard`: estornar investimento + taxa arremate + taxa reforma
  - Se demais: estornar apenas o investimento
- Atualizar RPC `admin_delete_property`:
  - Mesma lógica: ler plano de cada share para calcular estorno correto

### 2. UI — Popup/Dialog de Vinculação (3 locais)

Substituir o formulário inline por um `Dialog` nos 3 componentes:
- `PropertyInvestors.tsx` (detalhe do imóvel)
- `AuctionInvestorLinking.tsx` (leilão encerrado)
- `AdminPropertyForm.tsx` (criação de imóvel)

O dialog conterá:
1. **Campo de busca** por nome do investidor (filtro em tempo real na lista)
2. **Seletor de plano** (radio group com as 4 opções e descrição curta)
3. **Campo de valor** a vincular
4. **Resumo da operação** adaptado ao plano selecionado (mostra taxas ou "zero taxas")

### 3. Exibição do Plano nos Investidores Vinculados

- Mostrar um badge ao lado do nome do investidor indicando o plano (ex: "Padrão", "50/50", "12% fixo", "15% fixo")
- No resumo financeiro, a taxa exibida reflete o plano real de cada investidor

### 4. Revisão de Cálculos para Evitar Bugs

Pontos que precisam ser revisados após a mudança:

| Local | O que muda |
|-------|-----------|
| `PropertyInvestors.tsx` — cálculo de `serviceFee` | Não pode mais ser fixo; cada investidor tem taxa diferente |
| `AuctionInvestorLinking.tsx` — `totalFeeCharged` | Precisa somar taxas reais por plano, não calcular proporcionalmente |
| `AdminPropertyForm.tsx` — `totalProjetoComTaxas` | Taxa de serviço depende do plano de cada investidor pendente |
| `PropertyInvestors.tsx` — `maxLinkable` | O cálculo muda pois planos 2/3/4 não têm taxa |
| KPIs financeiros no admin | Receita Discovery varia por plano; precisa somar corretamente |
| `admin_delete_property` RPC | Estorno deve considerar o plano de cada share |
| Frontend do investidor (retorno estimado) | Planos 3/4 têm retorno fixo, não proporcional ao lucro |

### 5. Propriedades Existentes

Shares já criados receberão `standard` como default na migração, mantendo compatibilidade.

