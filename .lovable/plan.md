

# Mudanca do Modelo de Investimento: Admin Vincula Usuarios aos Leiloes

## Resumo da Mudanca

O modelo atual permite que o usuario deposite seus creditos diretamente em leiloes. O novo modelo transfere essa responsabilidade para o administrador: o usuario apenas recarrega creditos, e o admin decide em qual leilao alocar o dinheiro de cada investidor.

Isso resolve o problema de dinheiro "preso" em leiloes sem arremate, pois os creditos so saem da conta do usuario quando o admin decide aloca-los.

## Mudancas Necessarias

### 1. Criar RPC para deposito administrativo (banco de dados)

Nova funcao `admin_create_auction_deposit` que permite ao admin criar depositos em nome de usuarios. Reutiliza a mesma logica de taxas ($500 terreno / $5.000 casa) e validacoes (minimo $800, saldo suficiente).

### 2. Pagina de Leiloes do Usuario (`UserLeiloesPage.tsx`)

- Remover o componente `DepositForm` (usuario nao deposita mais)
- Remover o formulario de deposito de dentro do accordion de cada leilao
- Manter a visualizacao dos depositos existentes (somente leitura)
- Alterar o subtitulo para "Acompanhe seus investimentos em leiloes"

### 3. Pagina de Detalhe do Leilao (`LeilaoDetailPage.tsx`)

- Remover o formulario de deposito do usuario (card "Participar do Leilao")
- Adicionar secao para o admin vincular usuarios ao leilao:
  - Card com lista de usuarios que possuem creditos disponiveis
  - Select de usuario + input de valor + botao "Vincular"
  - Exibir regras de taxa e valor liquido
  - Disponivel enquanto o leilao nao estiver com status "finished"

### 4. Pagina de Leiloes do Admin (`AdminLeiloesPage.tsx`)

- Adicionar KPI no topo mostrando o "Total Disponivel para Investimento" (soma dos creditos de todos os usuarios nao-admin)

### 5. Remover deposito do usuario no detalhe do leilao

- Remover a variavel `canDeposit`, `depositAmount`, `depositMutation` do `LeilaoDetailPage`
- Remover o card "Participar do Leilao" inteiro

## Detalhes Tecnicos

### Nova RPC: `admin_create_auction_deposit`

```text
Parametros: p_auction_id, p_user_id, p_amount, p_auction_title
Validacoes:
  - Verifica se quem chama e admin (has_role)
  - Verifica saldo do usuario
  - Verifica valor minimo $800
  - Calcula taxa ($500 ou $5.000)
Acoes:
  - Insere em auction_deposits (com service_fee)
  - Debita creditos do usuario
  - Registra em credit_transactions
```

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/painel/UserLeiloesPage.tsx` | Remover DepositForm e formulario inline |
| `src/pages/painel/LeilaoDetailPage.tsx` | Remover deposito do usuario, adicionar vinculacao pelo admin |
| `src/pages/painel/AdminLeiloesPage.tsx` | Adicionar KPI de total disponivel |
| Migracao SQL | Criar RPC `admin_create_auction_deposit` |

### Fluxo do novo modelo

```text
Usuario recarrega creditos (sem mudanca)
         |
         v
Admin abre leilao e ve lista de usuarios com saldo
         |
         v
Admin seleciona usuario + valor e vincula ao leilao
         |
         v
Creditos sao debitados e deposito e criado
         |
         v
Se leilao nao resultar em compra:
  Admin estorna (ja funciona) e realoca no proximo
```

