## Objetivo
Separar cada imóvel em 3 etapas: Compra > Reforma > Venda, sem taxas de serviço. O cadastro continua com as estimativas (Arremate, Reforma, Total, Venda, Retorno) como referência.

## Como vai funcionar

**1. Compra**
- Meta: valor estimado de arremate.
- O admin vincula usuários e informa quanto cada um investiu na compra (sai do saldo de créditos; volta se o vínculo for removido).
- Botão "Concluir compra" muda o status para Reforma.

**2. Reforma**
- Meta: reforma estimada (terrenos pulam esta etapa).
- Qualquer usuário pode fazer aportes, mesmo quem não participou da compra. O valor sai do saldo.
- Botão "Concluir reforma" muda o status para À Venda.

**3. Venda**
- Resumo por investidor: compra + reforma = total investido, em $ e %.
- Novos campos: Documentação de Venda ($) e Comissão do Corretor ($), além do valor de venda.
- Cálculo automático: lucro = venda − documentação − comissão − total investido. Cada investidor recebe o lucro proporcional ao seu % do total, e o sistema mostra o retorno estimado de cada um.

**Regras gerais**
- Valores e investidores podem ser alterados a qualquer momento, em qualquer etapa (edição ajusta o saldo pela diferença).
- O admin pode voltar uma etapa se precisar.
- Todas as taxas (serviço, reforma, vendas, lucro) saem da tela de vinculação. Vínculos antigos com taxas continuam com estorno correto.

## Documentos
- Recibos: na lista de depósitos que entram na conta, botão para abrir o recibo dentro do sistema (visualizador em janela, sem sair do app).
- Contratos: na página de contratos que já existe, botão para abrir o PDF dentro do sistema.

## Detalhes técnicos
- `shares`: nova coluna `phase` ('purchase' | 'renovation', padrão 'purchase'); vínculos atuais ficam como compra.
- `properties`: novas colunas `sale_doc_cost`, `broker_commission` (padrão 0). Status reaproveita os existentes (auctioned/renovation_in_progress/for_sale/sold).
- Novas RPCs SECURITY DEFINER: `admin_link_investor_phase(property, user, amount, phase)`, `admin_update_share_amount(share, new_amount)` (debita/estorna a diferença), `admin_remove_share(share)`; registram em `credit_transactions`. `admin_unlink_investor` e `admin_delete_property` mantidos para estornos legados.
- Validação: soma da compra ≤ arremate estimado e da reforma ≤ reforma estimada apenas como aviso (não bloqueia, pois valores reais podem variar).
- UI: novo componente de etapas no detalhe do imóvel e na etapa Investidores do `AdminPropertyForm`; `LinkInvestorDialog` simplificado (usuário + valor + etapa). Visualizador de PDF/imagem reutilizável para recibos e contratos.
- Testes: cálculo de lucro e divisão proporcional por investidor.
