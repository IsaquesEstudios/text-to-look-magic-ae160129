

## Plan: Taxas inclusas no valor do aporte

### Problema atual
Quando o admin digita $5.000 no campo de valor e o plano é "Padrão", o sistema debita $5.000 + taxas. O usuário quer que $5.000 seja o **total debitado**, com as taxas já incluídas nesse valor.

### Abordagem
Manter a RPC como está (ela recebe o valor líquido de investimento e calcula as taxas por cima). Mudar apenas o **frontend** para calcular o valor líquido a partir do valor total digitado e passar esse líquido para a RPC.

**Exemplo**: Admin digita $5.000 para um imóvel com total_project = $50.000, service_fee = $5.000, renovation = $10.000:
- fee_rate = (5000 + 10000 * 0.10) / 50000 = 0.12
- net_investment = 5000 / (1 + 0.12) = $4.464,29
- Taxa arremate = $4.464,29 / $50.000 * $5.000 = $446,43
- Taxa reforma = $4.464,29 / $50.000 * $1.000 = $89,29
- Total debitado = $4.464,29 + $446,43 + $89,29 = **$5.000,00** ✓

### Mudanças (1 arquivo)

**`src/components/painel/admin/LinkInvestorDialog.tsx`**:
1. Renomear label do campo de "Valor a vincular" para "Valor do aporte (com taxas inclusas)"
2. O valor digitado (`currentAmount`) passa a representar o **total bruto**
3. Calcular `netInvestment = currentAmount / (1 + totalFeeRate)` para plano standard (para outros planos, net = currentAmount)
4. No resumo: mostrar "Total do aporte" = valor digitado, "Investimento líquido" = net, taxas separadas
5. Passar `netInvestment` (não `currentAmount`) para `onLink()`
6. Ajustar validações de max linkable (agora o limite por créditos = saldo direto, sem divisão)
7. Ajustar validação de remaining: `netInvestment > remaining` ao invés de `currentAmount > remaining`

### Sem mudança na RPC
A função `admin_link_investor_to_property` continua recebendo o valor líquido e calculando as taxas. O resultado final será idêntico, apenas o frontend passa o valor correto.

