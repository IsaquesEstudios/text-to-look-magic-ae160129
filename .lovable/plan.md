## Objetivo

Remover as 4 modalidades fixas (Padrão / 50-50 / 12% / 15%) do momento de vincular um investidor a um imóvel. No lugar, o admin preenche manualmente **4 taxas de serviço da Discovery**, cada uma podendo ser digitada como **porcentagem (%)** ou **valor fixo ($)**:

- **Serviço** — sua taxa de serviço sobre o aporte
- **Reforma** — sua taxa sobre o custo de reforma (ex.: 5% da reforma = você recebe 5% do valor da reforma)
- **Vendas** — sua taxa sobre o valor de venda estimado
- **Lucro** — sua taxa sobre o lucro estimado do investidor (ex.: 20% do lucro = você fica com 20% do que o investidor lucraria)

O **retorno estimado do investidor** continua sendo calculado automaticamente pela participação no projeto; a única diferença é que a "taxa de lucro" passa a ser o seu corte sobre esse lucro (substitui o antigo 70/30).

## Como cada taxa é calculada

Para cada campo, ao escolher `%`, a base é:

| Campo    | Base da porcentagem                          |
|----------|----------------------------------------------|
| Serviço  | valor do aporte (investimento líquido)       |
| Reforma  | proporcional: participação × custo de reforma|
| Vendas   | proporcional: participação × valor de venda  |
| Lucro    | lucro bruto estimado do investidor           |

Ao escolher `$`, o valor digitado é cobrado diretamente.

**Total debitado do investidor** = aporte líquido + serviço + reforma + vendas (taxas de entrada). A taxa de **lucro** não é cobrada na entrada — ela apenas reduz o retorno estimado mostrado (é o seu corte no lucro, liquidado na venda).

**Retorno estimado do investidor** = (lucro bruto pela participação) − taxa de lucro.

## Mudanças

### Banco de dados (migração)
- Adicionar à tabela `shares` as colunas para guardar o que foi cobrado/configurado em cada vínculo: `fee_service`, `fee_renovation`, `fee_sales`, `fee_profit_rate` (numéricas). Manter `investment_plan` por compatibilidade dos registros antigos, mas deixar de usá-lo nos novos.
- Reescrever a função `admin_link_investor_to_property` para receber os 4 valores de taxa já calculados (em $) do front-end, debitar `aporte + serviço + reforma + vendas` dos créditos, criar o share e registrar cada taxa em `credit_transactions` com descrição própria. Guardar também a taxa de lucro (%) no share.
- Ajustar `admin_unlink_investor` e `admin_delete_property` para estornar com base nas taxas realmente gravadas no share (em vez de recalcular pelos valores fixos antigos).

### Front-end
- `LinkInvestorDialog.tsx`: remover os botões dos 4 planos e o seletor; adicionar 4 campos de taxa, cada um com alternância **% / $** e cálculo ao vivo. Atualizar o resumo da operação (taxas detalhadas, total debitado, retorno estimado já descontando a taxa de lucro).
- `AuctionInvestorLinking.tsx`: passar os novos valores para a RPC; substituir o badge de plano por exibição das taxas aplicadas no investidor vinculado.
- Manter os textos/labels existentes em português e a formatação USD en-US.

## Observações
- Registros antigos (com plano) continuam válidos e exibidos; o estorno deles usará os valores gravados.
- Mudanças ficam restritas ao fluxo de vínculo (dialog + componente de leilão) e às 3 funções de banco citadas.
