

# Analise de Design, Seguranca e Funcionalidade

## Problemas Encontrados

---

### DESIGN / UI

#### 1. Warning no Console: PropertySubNav nao aceita refs
O console mostra: "Function components cannot be given refs" em `PropertySubNav`. Isso acontece porque o React Router `<Link>` esta tentando passar uma ref para o componente. Nao quebra a funcionalidade, mas polui o console.

**Correcao:** Envolver `PropertySubNav` com `React.forwardRef` ou verificar se algum componente pai esta passando ref indevida.

#### 2. Pagina de Gastos e Novidades travada em "Carregando"
No screenshot, a pagina mostra apenas "Carregando..." indefinidamente. Isso pode indicar que o auth state nao esta resolvendo corretamente ou que o usuario nao esta logado na sessao de preview.

#### 3. Sidebar mobile nao destaca sub-rotas
A navegacao mobile/sidebar so destaca o item quando `location.pathname === item.path` (comparacao exata). Se o usuario esta em `/painel/imovel/xxx/gastos`, nenhum item fica destacado. Deveria usar `startsWith` ou marcar "Meus Imoveis" como ativo quando em sub-rotas de imovel.

**Correcao:** Trocar de `===` para logica de `startsWith` que cubra as sub-rotas de imoveis.

#### 4. Retorno estimado no UserImoveis usa formula incorreta
Em `UserImoveis.tsx` (linha 77), o retorno estimado e calculado como:
```
totalPaid * (1 + returnPct / 100)
```
Isso esta errado. O `estimated_return_pct` e a margem do projeto inteiro, nao do valor investido pelo usuario. O retorno do investidor depende da sua porcentagem de participacao no projeto.

**Correcao:** Calcular a porcentagem de participacao do investidor e aplicar o retorno proporcional.

---

### SEGURANCA

#### 5. CRITICO: Politicas RLS sao RESTRICTIVE, nao PERMISSIVE
Todas as politicas RLS estao marcadas como `Permissive: No` (RESTRICTIVE). Isso e um problema serio porque politicas RESTRICTIVE exigem que TODAS as politicas aplicaveis passem simultaneamente. 

Para `profiles`, por exemplo, existem duas politicas SELECT:
- "Users can view own profile" (user_id = auth.uid())
- "Admins can view all profiles" (has_role admin)

Como sao RESTRICTIVE, um admin precisa passar AMBAS as politicas -- ou seja, um admin so consegue ver o PROPRIO perfil (porque a primeira politica falha para outros usuarios). Isso pode causar bugs silenciosos onde admins nao conseguem ver perfis de outros usuarios.

**Correcao:** Trocar as politicas de RESTRICTIVE para PERMISSIVE (que e o comportamento padrao do Supabase, onde apenas UMA politica precisa passar).

#### 6. Protecao contra senhas vazadas desabilitada
O linter do Supabase indica que a protecao contra senhas vazadas esta desabilitada. Isso permite que usuarios cadastrem senhas que ja foram comprometidas em vazamentos de dados.

**Correcao:** Habilitar "Leaked Password Protection" nas configuracoes de autenticacao.

#### 7. Storage buckets sao publicos
Os buckets `blog-images` e `property-media` sao publicos (`Is Public: Yes`). Qualquer pessoa com o URL pode acessar os arquivos, incluindo comprovantes de pagamento e fotos de propriedades.

**Correcao:** Para `property-media`, considerar tornar o bucket privado e usar signed URLs, ja que contem fotos de propriedades que podem ser sensiveis.

#### 8. Deposito no LeilaoDetailPage nao usa funcao atomica corretamente
Em `LeilaoDetailPage.tsx` (linha 134), apos o deposito bem-sucedido, o codigo invalida `["auth"]` como query key, mas essa query key nao existe -- o perfil e gerenciado pelo `useAuth` hook. O saldo do usuario nao atualiza na tela apos depositar neste componente (diferente do `UserLeiloesPage` que chama `refreshProfile()`).

**Correcao:** Chamar `refreshProfile()` apos o deposito, igual ao `UserLeiloesPage`.

---

### FUNCIONALIDADE

#### 9. Leilao auto-finish pelo cliente e inseguro
Em `UserLeiloesPage.tsx` (linha 357-359) e `LeilaoDetailPage.tsx`, quando o countdown chega a zero, o CLIENTE faz um `UPDATE` direto na tabela `auctions` para mudar o status para "finished". Qualquer usuario pode inspecionar o codigo e finalizar um leilao antes do tempo.

**Correcao:** Remover a logica de auto-finish do frontend. Implementar um cron/webhook no backend que verifica leiloes expirados, ou confiar no `scheduled_start` para exibir "Encerrado" no frontend sem alterar o banco.

#### 10. Extrato mistura transacoes de credito com shares
O `UserExtrato.tsx` combina `credit_transactions` e `shares` na mesma timeline, mas shares nao sao transacoes de credito -- sao vinculos de propriedade. Isso pode confundir o investidor, especialmente quando um deposito de leilao ja aparece como transacao e o vinculo tambem aparece separadamente.

**Correcao:** Remover shares do extrato financeiro, ou rotula-los claramente como "informacao de vinculacao" separada das movimentacoes de credito.

#### 11. `purchase_share` ainda existe como funcao no banco
A funcao `purchase_share` ainda existe no banco de dados, mas o sistema nao usa mais compra direta de cotas. Isso e codigo morto que pode causar confusao.

**Correcao:** Remover a funcao `purchase_share` do banco.

---

## Resumo de Prioridades

| # | Problema | Severidade | Esforco |
|---|----------|-----------|---------|
| 5 | Politicas RLS RESTRICTIVE | Critico | Medio |
| 9 | Auto-finish pelo cliente | Alto | Baixo |
| 8 | Deposito nao atualiza saldo | Medio | Baixo |
| 4 | Retorno estimado incorreto | Medio | Baixo |
| 3 | Sidebar nao destaca sub-rotas | Baixo | Baixo |
| 1 | Warning de ref no console | Baixo | Baixo |
| 6 | Leaked password protection | Medio | Baixo |
| 10 | Extrato mistura tipos | Baixo | Medio |
| 11 | Funcao purchase_share morta | Baixo | Baixo |
| 7 | Storage buckets publicos | Info | Baixo |

---

## Plano de Implementacao

### Fase 1 - Seguranca Critica (Item 5, 9)
1. **Recriar todas as politicas RLS como PERMISSIVE** para que a logica "usuario ve os seus OU admin ve todos" funcione corretamente.
2. **Remover logica de auto-finish do frontend** -- usar apenas o campo `scheduled_start` para mostrar "Encerrado" visualmente, sem alterar o banco pelo cliente.

### Fase 2 - Correcoes Funcionais (Itens 4, 8, 3)
3. **Corrigir calculo de retorno** no UserImoveis baseado na participacao proporcional.
4. **Adicionar `refreshProfile()`** ao deposito no LeilaoDetailPage.
5. **Melhorar highlight de sub-rotas** na sidebar/mobile nav.

### Fase 3 - Limpeza (Itens 1, 10, 11)
6. **Corrigir warning de ref** no PropertySubNav.
7. **Remover funcao `purchase_share`** do banco.
8. **Separar shares de transacoes** no extrato.

---

### Detalhes Tecnicos

**Item 5 - Recriar RLS como PERMISSIVE:**
```sql
-- Exemplo para profiles (repetir para todas as tabelas)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

**Item 9 - Remover auto-finish:**
Remover os blocos `onFinished` que fazem UPDATE na tabela `auctions` e substituir por logica visual pura (se `scheduled_start <= now()`, mostrar como "Encerrado" sem alterar o banco).

