

# Analise Geral do Sistema - Discovery Investments

## Problemas Encontrados

### 1. BUG CRITICO: PropertyDetail.tsx NAO espera `userShares` carregar
A mesma race condition que foi corrigida em `PropertyGastosPage` e `PropertyNovidadesPage` ainda existe em `PropertyDetail.tsx` (linha 64-76). O query `userShares` nao tem `isLoading` sendo verificado, entao o `PropertySubNav` pode receber `hasShares=false` antes dos dados carregarem, escondendo as abas "Novidades" e "Gastos" momentaneamente.

**Correcao:** Adicionar `isLoading: isSharesLoading` ao query de `userShares` e incluir na condicao de loading.

---

### 2. BUG: Extrato usa terminologia antiga "cotas"
Em `UserExtrato.tsx` (linha 59), a descricao de shares usa:
```
`Compra de ${s.quantity} cota${s.quantity > 1 ? "s" : ""} - ${...}`
```
O sistema ja removeu a terminologia de "cotas" e usa "vinculo direto". Deve ser algo como "Vinculado ao imovel - {titulo}".

---

### 3. BUG: Shares duplicados no banco de dados
A query mostra que o usuario `27cf125a...` tem **5 shares** para a propriedade `08457568...` (cada um de $100), e **3 shares** para `a1b2c3d4...` (cada um de $4,500). Isso acontece porque cada vinculacao do admin cria um novo registro. Nao e necessariamente um bug, mas o `UserImoveis.tsx` e o `UserDashboard.tsx` ja agrupam corretamente -- porem o `UserExtrato.tsx` mostra cada um como uma "compra de cota" separada, o que pode confundir.

---

### 4. INCONSISTENCIA: Formato de creditos (pt-BR vs en-US)
- `UserDashboard.tsx` (linha 160): `credits.toLocaleString("pt-BR")` - formato brasileiro
- `UserExtrato.tsx` (linha 77): `credits.toLocaleString("en-US")` - formato americano
- `UserExtrato.tsx` (linha 137): `Math.abs(item.amount).toLocaleString("pt-BR")` - formato brasileiro

Deveria ser tudo em formato americano (`en-US`) ja que o sistema usa dolares.

---

### 5. PROBLEMA: Deposito no leilao sem atomicidade
Em `UserLeiloesPage.tsx` (linhas 188-210), o deposito faz 3 operacoes separadas:
1. Insere `auction_deposit`
2. Atualiza `profiles.credits`
3. Insere `credit_transaction` (non-blocking)

Se a etapa 2 falhar apos a etapa 1 ter sucesso, o deposito fica registrado mas os creditos nao sao subtraidos. Idealmente, isso deveria ser uma funcao de banco de dados atomica (transaction).

---

### 6. MELHORIA: Admin nao tem protecao de rota no frontend
As rotas de admin (`/painel/imoveis`, `/painel/usuarios`, etc.) nao verificam `isAdmin` no componente de rota. Qualquer usuario autenticado pode navegar para essas URLs. A seguranca e garantida pelo RLS no backend, mas o usuario vera paginas vazias ou erros em vez de um redirecionamento limpo.

---

### 7. OBSERVACAO: Memoria desatualizada sobre tarifas
A memoria `flipping-system-expense-tracking` ainda menciona "taxas estaduais americanas (tarifas)", mas esse recurso ja foi removido do codigo. Nao e um bug funcional, mas pode causar confusao futura.

---

### 8. FUNCIONALIDADE FALTANTE: Remocao de deposito pelo admin
Atualmente, nao ha como um admin estornar/remover um deposito de leilao. A tabela `auction_deposits` nao tem politica de DELETE. Se um investidor depositar por engano, nao ha como reverter.

---

## Resumo de Prioridades

| # | Problema | Severidade | Esforco |
|---|----------|-----------|---------|
| 1 | Race condition em PropertyDetail | Alto | Baixo |
| 2 | Terminologia "cotas" no Extrato | Medio | Baixo |
| 4 | Formato de moeda inconsistente | Baixo | Baixo |
| 5 | Deposito nao atomico | Alto | Medio |
| 6 | Protecao de rotas admin | Medio | Baixo |
| 8 | Estorno de deposito | Medio | Medio |

## Plano de Implementacao

### Fase 1 - Correcoes rapidas (itens 1, 2, 4)
1. **PropertyDetail.tsx**: Adicionar `isSharesLoading` ao loading state, igual ao fix ja feito em GastosPage e NovidadesPage.
2. **UserExtrato.tsx**: Trocar "Compra de X cota(s)" por "Vinculado ao imovel - {titulo}".
3. **Padronizar** todos os `toLocaleString` para `"en-US"` com `minimumFractionDigits: 2`.

### Fase 2 - Seguranca (itens 5, 6)
4. **Criar funcao de banco** `process_auction_deposit` que faca o deposito, a subtracao de creditos e o log de transacao de forma atomica.
5. **Adicionar guard de admin** nos componentes de paginas admin (verificar `isAdmin` e redirecionar se falso).

### Fase 3 - Funcionalidade (item 8)
6. **Adicionar estorno de deposito**: politica RLS de DELETE para admins na tabela `auction_deposits`, com botao na interface de detalhes do leilao para o admin estornar e devolver creditos.

---

### Detalhes Tecnicos

**Item 1 - Fix PropertyDetail.tsx:**
```typescript
const { data: userShares, isLoading: isSharesLoading } = useQuery({...});

if (isLoading || isSharesLoading || authLoading) {
  return <Loader2 />;
}
```

**Item 5 - Funcao atomica de deposito:**
```sql
CREATE OR REPLACE FUNCTION process_auction_deposit(
  p_auction_id uuid, p_user_id uuid, p_amount numeric, p_auction_title text
) RETURNS void AS $$
BEGIN
  -- Verificar creditos
  IF (SELECT credits FROM profiles WHERE user_id = p_user_id) < p_amount THEN
    RAISE EXCEPTION 'Creditos insuficientes';
  END IF;
  -- Inserir deposito
  INSERT INTO auction_deposits (auction_id, user_id, amount) VALUES (p_auction_id, p_user_id, p_amount);
  -- Subtrair creditos
  UPDATE profiles SET credits = credits - p_amount WHERE user_id = p_user_id;
  -- Log transacao
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -p_amount, 'deposit', 'Deposito no leilao: ' || p_auction_title, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

